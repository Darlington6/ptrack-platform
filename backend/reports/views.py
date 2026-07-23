"""
Core API views for pTrack waste reports, recycling activities,
leaderboard and rewards.

Point economy:
  Report submitted   → +10 pts (citizen)
  Recycling logged   → +15 pts (citizen)
  Report verified    → +5  pts (citizen who filed the report)
"""

import math
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Q, Sum
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.services import PLASTIC_KG_PER_RECYCLING, PLASTIC_KG_PER_REPORT
from accounts.throttles import MapBboxThrottle, RecyclingLogThrottle, ReportSubmitThrottle
from core.notifications import notify
from core.pagination import FeedCursorPagination, StandardPagination
from push.helpers import send_push

from .models import BadgeDefinition, RecyclingActivity, Reward, WasteReport
from .permissions import IsAdminRole
from .serializers import (
    BadgeDefinitionSerializer,
    LeaderboardEntrySerializer,
    RecyclingActivitySerializer,
    RewardSerializer,
    WasteReportSerializer,
)
from .utils import get_points

User = get_user_model()


class RewardsPagination(FeedCursorPagination):
    ordering = "-date_earned"


class RecyclingPagination(FeedCursorPagination):
    ordering = "-date"


_LEADERBOARD_CACHE_KEY = "leaderboard:top20"
_LEADERBOARD_CACHE_TTL = 300  # 5 minutes
_COMMUNITY_STATS_CACHE_KEY = "community:stats"
_COMMUNITY_STATS_CACHE_TTL = 600  # 10 minutes
_COMMUNITY_TRENDS_CACHE_KEY = "community:trends"
_COMMUNITY_TRENDS_CACHE_TTL = 3600  # 1 hour

# Notification title suffixes — defined as constants so emoji characters
# are never scattered through logic code and are trivial to update in one place.
_ICON_REPORT = "\U0001f4cd"  # 📍
_ICON_RECYCLE = "\u267b\ufe0f"  # ♻️
_ICON_VERIFIED = "\u2705"  # ✅


def _award_badges(user, old_points: int, new_points: int) -> None:
    """Notify user of any points-based badge whose threshold this points increase just crossed."""
    newly_earned = BadgeDefinition.objects.filter(
        is_active=True,
        badge_type="points",
        required_points__gt=old_points,
        required_points__lte=new_points,
    )
    for badge in newly_earned:
        notify(
            user,
            "badge_earned",
            f"{badge.name} badge earned! {badge.icon or ''}".strip(),
            badge.description or f"You've earned the {badge.name} badge.",
            "/rewards",
            title_rw=f"Ibimenyetso bya {badge.name} byatsinzwe! {badge.icon or ''}".strip(),
            body_rw=f"Wahawe ibimenyetso bya {badge.name}.",
        )


# ── Reports ────────────────────────────────────────────────────────────────────


@extend_schema(
    tags=["reports"],
    parameters=[
        OpenApiParameter(
            "status", str, description="Filter by status: pending | verified | resolved"
        ),
        OpenApiParameter(
            "user", str, description="Pass 'me' to return only the current user's reports"
        ),
    ],
    responses={200: WasteReportSerializer(many=True)},
    summary="List waste reports",
    methods=["GET"],
)
@extend_schema(
    tags=["reports"],
    request=WasteReportSerializer,
    responses={201: OpenApiResponse(description="Created report + new points balance")},
    summary="Submit a new waste report (+10 pts)",
    methods=["POST"],
)
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def reports_list_create(request):
    """
    GET  — list all reports; supports ?status= and ?user=me filters.
    POST — submit a new report; automatically awards 10 points to the user.
    """
    if request.method == "GET":
        qs = WasteReport.objects.select_related("user").all()
        # Non-admins only see reports from users who allow public visibility,
        # plus their own reports regardless of that setting.
        if getattr(request.user, "role", "") != "admin":
            qs = qs.filter(Q(user__allow_public_reports=True) | Q(user=request.user))
        q = request.query_params
        if status_filter := q.get("status"):
            qs = qs.filter(status=status_filter)
        if q.get("user") == "me":
            qs = qs.filter(user=request.user)
        if waste_type := q.get("waste_type"):
            qs = qs.filter(waste_type=waste_type)
        if date_from := q.get("date_from"):
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to := q.get("date_to"):
            qs = qs.filter(created_at__date__lte=date_to)
        if search := q.get("search"):
            qs = qs.filter(
                Q(user__username__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__full_name__icontains=search)
            )
        ordering = q.get("ordering", "-created_at")
        allowed_orderings = {"created_at", "-created_at", "status", "-status"}
        qs = qs.order_by(ordering if ordering in allowed_orderings else "-created_at")

        # Bbox filter — throttled; max area ~100 km²
        north = request.query_params.get("north")
        south = request.query_params.get("south")
        east = request.query_params.get("east")
        west = request.query_params.get("west")
        if any([north, south, east, west]):
            throttle = MapBboxThrottle()
            if not throttle.allow_request(request, None):
                return Response(
                    {"detail": "Map refresh rate limit exceeded. Wait a moment."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            try:
                n, s, e, w = float(north), float(south), float(east), float(west)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "Invalid bbox params."}, status=status.HTTP_400_BAD_REQUEST
                )
            lat_center = (n + s) / 2
            lat_km = abs(n - s) * 111.0
            lng_km = abs(e - w) * 111.0 * math.cos(math.radians(lat_center))
            area_km2 = lat_km * lng_km
            if area_km2 > 100:
                return Response(
                    {"detail": f"Bounding box too large ({area_km2:.0f} km²). Max 100 km²."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            qs = qs.filter(latitude__lte=n, latitude__gte=s, longitude__lte=e, longitude__gte=w)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            return paginator.get_paginated_response(WasteReportSerializer(page, many=True).data)
        return Response(WasteReportSerializer(qs, many=True).data)

    # POST — apply submit throttle inline
    throttle = ReportSubmitThrottle()
    if not throttle.allow_request(request, None):
        return Response(
            {"detail": "Report submission rate limit exceeded. Try again later."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    serializer = WasteReportSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    from .utils import coords_to_sector

    lat = float(request.data.get("latitude", 0))
    lng = float(request.data.get("longitude", 0))
    report = serializer.save(user=request.user, sector=coords_to_sector(lat, lng))

    pts = get_points("report_submitted", fallback=5)
    Reward.objects.create(user=request.user, points_earned=pts, reward_type="report_submitted")
    old_points = request.user.points
    request.user.points += pts
    request.user.save(update_fields=["points"])
    _award_badges(request.user, old_points, request.user.points)

    _prefs = getattr(request.user, "notification_preferences", {}) or {}
    if _prefs.get("report_notifications", True):
        notify(
            request.user,
            "report",
            f"Report received! {_ICON_REPORT}",
            f"Your waste report is under review. +{pts} pts added.",
            f"/reports/{report.pk}",
            title_rw=f"Raporo yakirijwe! {_ICON_REPORT}",
            body_rw=f"Raporo yawe y'imyanda iriho gusuzumwa. Amanota +{pts} ongeweho.",
        )
        if _prefs.get("push_enabled", False):
            send_push(
                request.user,
                "Report received!",
                f"Your waste report is under review — +{pts} pts added.",
                f"/reports/{report.pk}",
            )

    # Invalidate caches affected by a new report
    cache.delete(_LEADERBOARD_CACHE_KEY)
    cache.delete(_COMMUNITY_STATS_CACHE_KEY)
    cache.delete(f"user:profile:{request.user.pk}")

    return Response(
        {
            **WasteReportSerializer(report).data,
            "points_earned": pts,
            "new_points_balance": request.user.points,
        },
        status=status.HTTP_201_CREATED,
    )


@extend_schema(
    tags=["reports"],
    responses={200: WasteReportSerializer},
    summary="Retrieve a single report",
    methods=["GET"],
)
@extend_schema(
    tags=["reports"],
    responses={204: OpenApiResponse(description="Report deleted")},
    summary="Delete a report (owner only)",
    methods=["DELETE"],
)
@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def report_detail(request, pk):
    """GET a single waste report by ID, or DELETE it (owner only)."""
    try:
        report = WasteReport.objects.select_related("user").get(pk=pk)
    except WasteReport.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        if report.user_id != request.user.id:
            return Response(
                {"detail": "You can only delete your own reports."},
                status=status.HTTP_403_FORBIDDEN,
            )
        report.delete()
        cache.delete(_LEADERBOARD_CACHE_KEY)
        cache.delete(_COMMUNITY_STATS_CACHE_KEY)
        cache.delete(f"user:profile:{request.user.pk}")
        return Response(status=status.HTTP_204_NO_CONTENT)

    is_owner = report.user_id == request.user.id
    is_admin = getattr(request.user, "role", "") == "admin"
    if not (is_owner or is_admin):
        return Response(
            {"detail": "You can only view your own reports."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return Response(WasteReportSerializer(report).data)


@extend_schema(
    tags=["reports"],
    request=None,
    responses={200: WasteReportSerializer},
    summary="Verify a report (admin only, +5 pts to citizen)",
)
@api_view(["PATCH"])
@permission_classes([IsAdminRole])
def report_verify(request, pk):
    """
    Mark a report as verified and award 5 bonus points to the citizen who filed it.
    Requires admin role.
    """
    try:
        report = WasteReport.objects.select_related("user").get(pk=pk)
    except WasteReport.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    report.status = "verified"
    report.save(update_fields=["status"])

    bonus_pts = get_points("verification_bonus", fallback=10)
    Reward.objects.create(
        user=report.user, points_earned=bonus_pts, reward_type="verification_bonus"
    )
    old_points = report.user.points
    report.user.points += bonus_pts
    report.user.save(update_fields=["points"])
    _award_badges(report.user, old_points, report.user.points)

    _vprefs = getattr(report.user, "notification_preferences", {}) or {}
    if _vprefs.get("verification_notifications", True):
        note = request.data.get("note", "")
        detail = f" Note: {note}" if note else ""
        detail_rw = f" Icyitonderwa: {note}" if note else ""
        notify(
            report.user,
            "verification",
            f"Report verified! {_ICON_VERIFIED}",
            f"An admin verified your waste report. +{bonus_pts} bonus pts added.{detail}",
            f"/reports/{report.pk}",
            title_rw=f"Raporo yemejwe! {_ICON_VERIFIED}",
            body_rw=f"Umuyobozi yemeje raporo yawe y'imyanda. Amanota ya nyongera +{bonus_pts} ongeweho.{detail_rw}",
        )
        if _vprefs.get("push_enabled", False):
            send_push(
                report.user,
                f"Report verified! {_ICON_VERIFIED}",
                f"An admin verified your waste report — +{bonus_pts} bonus pts.",
                f"/reports/{report.pk}",
            )

    cache.delete(_LEADERBOARD_CACHE_KEY)
    cache.delete(f"user:profile:{report.user.pk}")

    return Response(WasteReportSerializer(report).data)


@extend_schema(
    tags=["reports"],
    request=None,
    responses={200: WasteReportSerializer},
    summary="Reject a report (admin only)",
)
@api_view(["PATCH"])
@permission_classes([IsAdminRole])
def report_reject(request, pk):
    """Mark a report as rejected and notify the citizen."""
    try:
        report = WasteReport.objects.select_related("user").get(pk=pk)
    except WasteReport.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get("reason", "")
    report.status = "rejected"
    report.save(update_fields=["status"])

    _rprefs = getattr(report.user, "notification_preferences", {}) or {}
    if _rprefs.get("verification_notifications", True):
        detail = f" Reason: {reason}" if reason else ""
        detail_rw = f" Impamvu: {reason}" if reason else ""
        notify(
            report.user,
            "rejection",
            "Report rejected",
            f"An admin reviewed and rejected your waste report.{detail}",
            f"/reports/{report.pk}",
            title_rw="Raporo yahakanwe",
            body_rw=f"Umuyobozi yasuzuye kandi yananiye raporo yawe y'imyanda.{detail_rw}",
        )

    return Response(WasteReportSerializer(report).data)


@extend_schema(
    tags=["reports"],
    request=None,
    responses={200: WasteReportSerializer},
    summary="Mark a report as resolved (admin only)",
)
@api_view(["PATCH"])
@permission_classes([IsAdminRole])
def report_resolve(request, pk):
    """Mark a verified report as resolved (waste physically collected/cleaned up)."""
    try:
        report = WasteReport.objects.select_related("user").get(pk=pk)
    except WasteReport.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    report.status = "resolved"
    report.save(update_fields=["status"])

    _rprefs = getattr(report.user, "notification_preferences", {}) or {}
    if _rprefs.get("verification_notifications", True):
        notify(
            report.user,
            "verification",
            "Report resolved!",
            "Great news! The waste you reported has been collected and resolved.",
            f"/reports/{report.pk}",
            title_rw="Raporo yakemuwe!",
            body_rw="Amakuru meza! Imyanda warangiye gutanga yacuwe.",
        )

    return Response(WasteReportSerializer(report).data)


# ── Recycling ──────────────────────────────────────────────────────────────────


@extend_schema(
    tags=["recycling"],
    responses={200: RecyclingActivitySerializer(many=True)},
    summary="List current user's recycling activities",
    methods=["GET"],
)
@extend_schema(
    tags=["recycling"],
    request=RecyclingActivitySerializer,
    responses={201: OpenApiResponse(description="Created activity + new points balance")},
    summary="Log a recycling activity (+15 pts)",
    methods=["POST"],
)
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def recycling_list_create(request):
    """
    GET  — return all recycling activities for the current user.
    POST — log a new activity; automatically awards 15 points.
    """
    if request.method == "GET":
        qs = RecyclingActivity.objects.filter(user=request.user)
        paginator = RecyclingPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            return paginator.get_paginated_response(
                RecyclingActivitySerializer(page, many=True).data
            )
        return Response(RecyclingActivitySerializer(qs, many=True).data)

    # POST — apply log throttle inline
    throttle = RecyclingLogThrottle()
    if not throttle.allow_request(request, None):
        return Response(
            {"detail": "Recycling log rate limit exceeded. Try again later."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # One recycling log per user per day
    today = timezone.now().date()
    if RecyclingActivity.objects.filter(user=request.user, date__date=today).exists():
        return Response(
            {"detail": "You've already logged a recycling activity today. Come back tomorrow!"},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    serializer = RecyclingActivitySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    pts = get_points("recycling_logged", fallback=15)
    activity = serializer.save(user=request.user, points_awarded=pts)

    Reward.objects.create(user=request.user, points_earned=pts, reward_type="recycling_logged")
    old_points = request.user.points
    request.user.points += pts
    request.user.save(update_fields=["points"])
    _award_badges(request.user, old_points, request.user.points)

    _rprefs = getattr(request.user, "notification_preferences", {}) or {}
    if _rprefs.get("recycling_notifications", True):
        notify(
            request.user,
            "recycling",
            f"Recycling logged! {_ICON_RECYCLE}",
            f"Your recycling activity was recorded. +{pts} pts added.",
            "/rewards",
            title_rw=f"Ugusubiza kwanditswe! {_ICON_RECYCLE}",
            body_rw=f"Igikorwa cyawe cy'ugusubiza cyanditswe. Amanota +{pts} ongeweho.",
        )
        if _rprefs.get("push_enabled", False):
            send_push(
                request.user,
                f"Recycling logged! {_ICON_RECYCLE}",
                f"Recycling activity recorded — +{pts} pts added.",
                "/rewards",
            )

    cache.delete(_LEADERBOARD_CACHE_KEY)
    cache.delete(f"user:profile:{request.user.pk}")

    return Response(
        {
            **RecyclingActivitySerializer(activity).data,
            "points_earned": pts,
            "new_points_balance": request.user.points,
        },
        status=status.HTTP_201_CREATED,
    )


# ── Leaderboard ────────────────────────────────────────────────────────────────


@extend_schema(
    tags=["leaderboard"],
    parameters=[
        OpenApiParameter(
            name="period",
            type=str,
            enum=["week", "month", "all"],
            default="all",
            description="Score window: week (7 days), month (30 days), or all-time total.",
        )
    ],
    responses={200: LeaderboardEntrySerializer(many=True)},
    summary="Top 20 users ranked by points for the chosen period",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    """Return the top 20 users by points for the requested period. Cached 5 min."""
    period = request.query_params.get("period", "all")

    if period in ("week", "month"):
        cutoff = timezone.now() - timedelta(days=7 if period == "week" else 30)
        rows = (
            Reward.objects.filter(
                date_earned__gte=cutoff,
                user__show_on_leaderboard=True,
                user__is_deleted=False,
            )
            .values("user__id", "user__username", "user__full_name", "user__sector")
            .annotate(points=Sum("points_earned"))
            .order_by("-points")[:20]
        )
        data = [
            {
                "rank": idx + 1,
                "id": row["user__id"],
                "username": row["user__username"],
                "full_name": row["user__full_name"] or row["user__username"],
                "points": row["points"],
                "sector": row["user__sector"],
            }
            for idx, row in enumerate(rows)
        ]
    else:
        data = cache.get(_LEADERBOARD_CACHE_KEY)
        if data is None:
            top_users = User.objects.filter(show_on_leaderboard=True, is_deleted=False).order_by(
                "-points"
            )[:20]
            data = [
                {
                    "rank": idx + 1,
                    "id": u.id,
                    "username": u.username,
                    "full_name": u.full_name or u.username,
                    "points": u.points,
                    "sector": u.sector,
                }
                for idx, u in enumerate(top_users)
            ]
            cache.set(_LEADERBOARD_CACHE_KEY, data, timeout=_LEADERBOARD_CACHE_TTL)

    return Response(data)


# ── Point configs (citizen-readable) ──────────────────────────────────────────


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def point_configs(request):
    """Return event→points mapping so the UI can show accurate values dynamically."""
    from .models import PointConfiguration

    return Response({c.event: c.points for c in PointConfiguration.objects.all()})


# ── Badges (public) ────────────────────────────────────────────────────────────


@extend_schema(
    tags=["badges"],
    responses={200: BadgeDefinitionSerializer(many=True)},
    summary="List all active badge definitions (public)",
)
@api_view(["GET"])
@permission_classes([])
def badges_list(request):
    """Return all active badge definitions ordered by required_points. No auth required."""
    badges = BadgeDefinition.objects.filter(is_active=True)
    return Response(BadgeDefinitionSerializer(badges, many=True).data)


# ── Rewards ────────────────────────────────────────────────────────────────────


@extend_schema(
    tags=["rewards"],
    responses={200: OpenApiResponse(description="total_points + rewards list")},
    summary="Current user's reward history and points total",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_rewards(request):
    """Return all rewards earned by the current user with cursor pagination."""
    rewards = Reward.objects.filter(user=request.user)

    paginator = RewardsPagination()
    page = paginator.paginate_queryset(rewards, request)
    if page is not None:
        return paginator.get_paginated_response(
            {
                "total_points": request.user.points,
                "rewards": RewardSerializer(page, many=True).data,
            }
        )

    return Response(
        {
            "total_points": request.user.points,
            "rewards": RewardSerializer(rewards, many=True).data,
        }
    )


# ── Community stats ────────────────────────────────────────────────────────────


def _compute_community_stats() -> dict:
    """Platform-wide totals shared by the authenticated and public stats endpoints."""
    month_ago = timezone.now() - timedelta(days=30)
    total_reports = WasteReport.objects.count()
    total_recycling = RecyclingActivity.objects.count()
    estimated_plastic_kg = round(
        total_reports * PLASTIC_KG_PER_REPORT + total_recycling * PLASTIC_KG_PER_RECYCLING, 2
    )
    return {
        "total_reports": total_reports,
        "verified_reports": WasteReport.objects.filter(status="verified").count(),
        "total_recycling_activities": total_recycling,
        "total_points_awarded": Reward.objects.aggregate(t=Sum("points_earned"))["t"] or 0,
        # "Active citizens" = role:citizen only (excludes admins shown on landing/community pages),
        # account enabled, any activity within 30 days or account < 30 days old.
        "active_citizens": User.objects.filter(is_active=True, is_deleted=False, role="citizen")
        .filter(Q(last_activity_date__gte=month_ago.date()) | Q(date_joined__gte=month_ago))
        .count(),
        "estimated_plastic_kg": estimated_plastic_kg,
    }


@extend_schema(
    tags=["reports"],
    responses={200: OpenApiResponse(description="Platform-wide community impact stats")},
    summary="Community impact stats (cached 10 min)",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def community_stats(request):
    """Return platform-wide totals. Cached for 10 minutes."""
    data = cache.get(_COMMUNITY_STATS_CACHE_KEY)
    if data is None:
        data = _compute_community_stats()
        cache.set(_COMMUNITY_STATS_CACHE_KEY, data, timeout=_COMMUNITY_STATS_CACHE_TTL)
    return Response(data)


@extend_schema(
    tags=["reports"],
    responses={200: OpenApiResponse(description="Public subset of community impact stats")},
    summary="Public community impact stats for the landing page (cached 10 min)",
)
@api_view(["GET"])
@permission_classes([AllowAny])
def community_stats_public(request):
    """Unauthenticated landing-page stats. Shares the same cache as community_stats."""
    data = cache.get(_COMMUNITY_STATS_CACHE_KEY)
    if data is None:
        data = _compute_community_stats()
        cache.set(_COMMUNITY_STATS_CACHE_KEY, data, timeout=_COMMUNITY_STATS_CACHE_TTL)
    return Response(data)


# ── Community trends ───────────────────────────────────────────────────────────


@extend_schema(
    tags=["reports"],
    responses={200: OpenApiResponse(description="12-week rolling activity breakdown")},
    summary="12-week community activity trends (cached 1 h)",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def community_trends(request):
    """Return weekly report/recycling/points buckets for the past 12 weeks. Cached 1 hour."""
    data = cache.get(_COMMUNITY_TRENDS_CACHE_KEY)
    if data is None:
        now = timezone.now()
        weeks = []
        for i in range(11, -1, -1):
            week_start = (now - timedelta(weeks=i)).date()
            week_start -= timedelta(days=week_start.weekday())
            week_end = week_start + timedelta(days=7)

            reports_count = WasteReport.objects.filter(
                created_at__date__gte=week_start, created_at__date__lt=week_end
            ).count()
            recycling_count = RecyclingActivity.objects.filter(
                date__gte=week_start, date__lt=week_end
            ).count()
            points = (
                Reward.objects.filter(
                    date_earned__date__gte=week_start, date_earned__date__lt=week_end
                ).aggregate(t=Sum("points_earned"))["t"]
                or 0
            )

            weeks.append(
                {
                    "week": week_start.isoformat(),
                    "reports": reports_count,
                    "recycling": recycling_count,
                    "points": points,
                }
            )

        data = {"weeks": weeks}
        cache.set(_COMMUNITY_TRENDS_CACHE_KEY, data, timeout=_COMMUNITY_TRENDS_CACHE_TTL)

    return Response(data)
