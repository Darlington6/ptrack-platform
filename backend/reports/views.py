"""
Core API views for pTrack waste reports, recycling activities,
leaderboard and rewards.

Point economy:
  Report submitted   → +10 pts (citizen)
  Recycling logged   → +15 pts (citizen)
  Report verified    → +5  pts (citizen who filed the report)
"""

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Sum
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.throttles import RecyclingLogThrottle, ReportSubmitThrottle
from core.pagination import FeedCursorPagination, StandardPagination

from .models import RecyclingActivity, Reward, WasteReport
from .permissions import IsAdminRole
from .serializers import (
    LeaderboardEntrySerializer,
    RecyclingActivitySerializer,
    RewardSerializer,
    WasteReportSerializer,
)

User = get_user_model()

_LEADERBOARD_CACHE_KEY = "leaderboard:top20"
_LEADERBOARD_CACHE_TTL = 300  # 5 minutes
_COMMUNITY_STATS_CACHE_KEY = "community:stats"
_COMMUNITY_STATS_CACHE_TTL = 600  # 10 minutes


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
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if request.query_params.get("user") == "me":
            qs = qs.filter(user=request.user)

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

    report = serializer.save(user=request.user)

    Reward.objects.create(user=request.user, points_earned=10, reward_type="report_submitted")
    request.user.points += 10
    request.user.save(update_fields=["points"])

    # Invalidate caches affected by a new report
    cache.delete(_LEADERBOARD_CACHE_KEY)
    cache.delete(_COMMUNITY_STATS_CACHE_KEY)
    cache.delete(f"user:profile:{request.user.pk}")

    return Response(
        {**WasteReportSerializer(report).data, "new_points_balance": request.user.points},
        status=status.HTTP_201_CREATED,
    )


@extend_schema(
    tags=["reports"], responses={200: WasteReportSerializer}, summary="Retrieve a single report"
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_detail(request, pk):
    """Return a single waste report by ID."""
    try:
        report = WasteReport.objects.select_related("user").get(pk=pk)
    except WasteReport.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
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

    Reward.objects.create(user=report.user, points_earned=5, reward_type="verification_bonus")
    report.user.points += 5
    report.user.save(update_fields=["points"])

    cache.delete(_LEADERBOARD_CACHE_KEY)
    cache.delete(f"user:profile:{report.user.pk}")

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
        paginator = FeedCursorPagination()
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

    serializer = RecyclingActivitySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    activity = serializer.save(user=request.user, points_awarded=15)

    Reward.objects.create(user=request.user, points_earned=15, reward_type="recycling_logged")
    request.user.points += 15
    request.user.save(update_fields=["points"])

    cache.delete(_LEADERBOARD_CACHE_KEY)
    cache.delete(f"user:profile:{request.user.pk}")

    return Response(
        {**RecyclingActivitySerializer(activity).data, "new_points_balance": request.user.points},
        status=status.HTTP_201_CREATED,
    )


# ── Leaderboard ────────────────────────────────────────────────────────────────


@extend_schema(
    tags=["leaderboard"],
    responses={200: LeaderboardEntrySerializer(many=True)},
    summary="Top 20 users ranked by points",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    """Return the top 20 users ordered by total points (descending). Cached 5 min."""
    data = cache.get(_LEADERBOARD_CACHE_KEY)
    if data is None:
        top_users = User.objects.filter(show_on_leaderboard=True).order_by("-points")[:20]
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

    paginator = FeedCursorPagination()
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
        data = {
            "total_reports": WasteReport.objects.count(),
            "verified_reports": WasteReport.objects.filter(status="verified").count(),
            "total_recycling_activities": RecyclingActivity.objects.count(),
            "total_points_awarded": Reward.objects.aggregate(t=Sum("points_earned"))["t"] or 0,
            "active_citizens": User.objects.filter(points__gt=0).count(),
        }
        cache.set(_COMMUNITY_STATS_CACHE_KEY, data, timeout=_COMMUNITY_STATS_CACHE_TTL)
    return Response(data)
