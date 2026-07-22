"""
Admin-only API views for pTrack.

All endpoints require IsAdminRole (user.role == "admin").
Grouped by resource:
  /api/v1/admin/analytics/   — aggregated platform stats
  /api/v1/admin/audit-logs/  — paginated AuditLog CRUD + CSV export
  /api/v1/admin/reports/     — bulk verify/reject + CSV export
  /api/v1/admin/configurations/ — PointConfiguration + BadgeDefinition CRUD
"""

import csv
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Count, Q, Sum  # noqa: F401
from django.http import StreamingHttpResponse
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from reports.models import BadgeDefinition, PointConfiguration, Reward, WasteReport
from reports.permissions import IsAdminRole
from reports.utils import bust_points_cache, get_points

from .models import AuditLog
from .pagination import FeedCursorPagination, StandardPagination

User = get_user_model()

_ANALYTICS_CACHE_TTL = 300  # 5 minutes


# ── Serializers (inline — admin only, no need for separate file) ───────────────


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "actor_email",
            "action",
            "target_type",
            "target_id",
            "metadata",
            "ip_address",
            "user_agent",
            "created_at",
        ]
        read_only_fields = fields

    def get_actor_email(self, obj):
        return obj.actor.email if obj.actor else None


class PointConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointConfiguration
        fields = ["id", "event", "points", "description", "updated_at"]
        read_only_fields = ["id", "updated_at"]


class BadgeDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BadgeDefinition
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "required_points",
            "badge_type",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


# ── CSV helpers ────────────────────────────────────────────────────────────────


class _Echo:
    def write(self, value):
        return value


def _csv_stream(header, rows):
    writer = csv.writer(_Echo())
    yield writer.writerow(header)
    for row in rows:
        yield writer.writerow(row)


def _log_export(request, filename: str) -> None:
    from .models import AuditLog

    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    ip = xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")
    AuditLog.objects.create(
        actor=request.user,
        action=f"GET {request.path}",
        metadata={"export_file": filename, "query_string": request.META.get("QUERY_STRING", "")},
        ip_address=ip,
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
    )


# ── Analytics ──────────────────────────────────────────────────────────────────


@extend_schema(
    tags=["admin-analytics"],
    parameters=[
        OpenApiParameter("days", int, description="Number of days to look back (default 84 = 12w)"),
    ],
    responses={200: OpenApiResponse(description="Weekly report counts")},
    summary="Reports over time — weekly buckets (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def analytics_reports_over_time(request):
    days = int(request.query_params.get("days", 84))
    cache_key = f"admin:analytics:reports_over_time:{days}"
    data = cache.get(cache_key)
    if data is None:
        now = timezone.now()
        weeks = []
        for i in range(days // 7 - 1, -1, -1):
            w_start = (now - timedelta(weeks=i)).date()
            w_start -= timedelta(days=w_start.weekday())
            w_end = w_start + timedelta(days=7)
            count = WasteReport.objects.filter(
                created_at__date__gte=w_start, created_at__date__lt=w_end
            ).count()
            weeks.append({"week": w_start.isoformat(), "count": count})
        data = {"weeks": weeks}
        cache.set(cache_key, data, timeout=_ANALYTICS_CACHE_TTL)
    return Response(data)


@extend_schema(
    tags=["admin-analytics"],
    responses={200: OpenApiResponse(description="Report counts grouped by user sector")},
    summary="Reports by sector (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def analytics_by_sector(request):
    cache_key = "admin:analytics:by_sector"
    data = cache.get(cache_key)
    if data is None:
        rows = WasteReport.objects.values("sector").annotate(count=Count("id")).order_by("-count")
        data = [{"sector": r["sector"] or "Outside Kigali", "count": r["count"]} for r in rows]
        cache.set(cache_key, data, timeout=_ANALYTICS_CACHE_TTL)
    return Response(data)


@extend_schema(
    tags=["admin-analytics"],
    responses={200: OpenApiResponse(description="Report counts grouped by waste type")},
    summary="Reports by waste type (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def analytics_by_type(request):
    cache_key = "admin:analytics:by_type"
    data = cache.get(cache_key)
    if data is None:
        rows = (
            WasteReport.objects.values("waste_type").annotate(count=Count("id")).order_by("-count")
        )
        data = list(rows)
        cache.set(cache_key, data, timeout=_ANALYTICS_CACHE_TTL)
    return Response(data)


@extend_schema(
    tags=["admin-analytics"],
    parameters=[
        OpenApiParameter("limit", int, description="Number of users to return (default 20)"),
    ],
    responses={200: OpenApiResponse(description="Top users by points")},
    summary="Top users by points (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def analytics_top_users(request):
    limit = min(int(request.query_params.get("limit", 20)), 100)
    cache_key = f"admin:analytics:top_users:{limit}"
    data = cache.get(cache_key)
    if data is None:
        users = User.objects.order_by("-points")[:limit]
        data = [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name or u.username,
                "points": u.points,
                "sector": u.sector,
                "report_count": u.reports.count(),
            }
            for u in users
        ]
        cache.set(cache_key, data, timeout=_ANALYTICS_CACHE_TTL)
    return Response(data)


@extend_schema(
    tags=["admin-analytics"],
    responses={200: OpenApiResponse(description="Report lat/lon coordinates for heatmap")},
    summary="Report heatmap coordinates (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def analytics_heatmap(request):
    cache_key = "admin:analytics:heatmap"
    data = cache.get(cache_key)
    if data is None:
        points = list(
            WasteReport.objects.filter(~Q(latitude=None), ~Q(longitude=None)).values(
                "latitude", "longitude", "waste_type", "status"
            )
        )
        data = {"points": points}
        cache.set(cache_key, data, timeout=_ANALYTICS_CACHE_TTL)
    return Response(data)


@extend_schema(
    tags=["admin-analytics"],
    responses={200: OpenApiResponse(description="Key performance indicators")},
    summary="Platform KPIs (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def analytics_kpis(request):
    cache_key = "admin:analytics:kpis"
    data = cache.get(cache_key)
    if data is None:
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        quarter_ago = now - timedelta(days=90)
        data = {
            "total_reports": WasteReport.objects.count(),
            "pending_reports": WasteReport.objects.filter(status="pending").count(),
            "verified_reports": WasteReport.objects.filter(status="verified").count(),
            "reports_this_week": WasteReport.objects.filter(created_at__gte=week_ago).count(),
            "reports_this_month": WasteReport.objects.filter(created_at__gte=month_ago).count(),
            "reports_last_90d": WasteReport.objects.filter(created_at__gte=quarter_ago).count(),
            "total_citizens": User.objects.filter(role="citizen").count(),
            "active_citizens_30d": User.objects.filter(
                is_active=True,
                is_deleted=False,
            )
            .filter(Q(last_activity_date__gte=month_ago.date()) | Q(date_joined__gte=month_ago))
            .count(),
            "total_points_awarded": Reward.objects.aggregate(t=Sum("points_earned"))["t"] or 0,
        }
        cache.set(cache_key, data, timeout=_ANALYTICS_CACHE_TTL)
    return Response(data)


@extend_schema(
    tags=["admin-analytics"],
    responses={200: OpenApiResponse(description="Engagement funnel: real citizen counts")},
    summary="Engagement funnel (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def analytics_funnel(request):
    cache_key = "admin:analytics:funnel"
    data = cache.get(cache_key)
    if data is None:
        total = User.objects.filter(role="citizen").count()
        with_report = User.objects.filter(role="citizen", reports__isnull=False).distinct().count()
        with_verified = (
            User.objects.filter(role="citizen", reports__status__in=["verified", "resolved"])
            .distinct()
            .count()
        )
        with_streak = User.objects.filter(role="citizen", current_streak__gte=7).count()

        def pct(n):
            return round(n / total * 100) if total else 0

        data = [
            {"label": "Registered users", "count": total, "pct": 100},
            {"label": "Submitted ≥1 report", "count": with_report, "pct": pct(with_report)},
            {"label": "Had a report verified", "count": with_verified, "pct": pct(with_verified)},
            {"label": "Streak ≥7 days", "count": with_streak, "pct": pct(with_streak)},
        ]
        cache.set(cache_key, data, timeout=_ANALYTICS_CACHE_TTL)
    return Response(data)


# ── Audit Log ──────────────────────────────────────────────────────────────────


@extend_schema(
    tags=["admin-audit-logs"],
    parameters=[
        OpenApiParameter("actor", int, description="Filter by actor user ID"),
        OpenApiParameter("action", str, description="Filter by action contains"),
    ],
    responses={200: AuditLogSerializer(many=True)},
    summary="Paginated audit log (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def audit_log_list(request):
    qs = AuditLog.objects.select_related("actor").all()

    actor_id = request.query_params.get("actor")
    if actor_id:
        qs = qs.filter(actor_id=actor_id)

    action = request.query_params.get("action")
    if action:
        qs = qs.filter(action__icontains=action)

    target_type = request.query_params.get("target_type")
    if target_type:
        qs = qs.filter(target_type__icontains=target_type)

    date_from = request.query_params.get("date_from")
    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)

    date_to = request.query_params.get("date_to")
    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)

    paginator = FeedCursorPagination()
    page = paginator.paginate_queryset(qs, request)
    if page is not None:
        return paginator.get_paginated_response(AuditLogSerializer(page, many=True).data)
    return Response(AuditLogSerializer(qs, many=True).data)


@extend_schema(
    tags=["admin-audit-logs"],
    responses={200: AuditLogSerializer},
    summary="Retrieve a single audit log entry (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def audit_log_detail(request, pk):
    try:
        entry = AuditLog.objects.select_related("actor").get(pk=pk)
    except AuditLog.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(AuditLogSerializer(entry).data)


@extend_schema(
    tags=["admin-audit-logs"],
    responses={200: OpenApiResponse(description="CSV file download")},
    summary="Export audit logs as CSV (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def audit_log_export(request):
    _log_export(request, "audit_logs.csv")
    qs = AuditLog.objects.select_related("actor").all().order_by("-created_at")

    header = ["id", "actor_email", "action", "target_type", "target_id", "ip_address", "created_at"]

    def rows():
        for entry in qs.iterator():
            yield [
                entry.id,
                entry.actor.email if entry.actor else "",
                entry.action,
                entry.target_type,
                entry.target_id or "",
                entry.ip_address or "",
                entry.created_at.isoformat(),
            ]

    response = StreamingHttpResponse(_csv_stream(header, rows()), content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="audit_logs.csv"'
    return response


# ── Admin reports: bulk ops + export ──────────────────────────────────────────


@extend_schema(
    tags=["admin-reports"],
    request=None,
    responses={200: OpenApiResponse(description="Number of reports verified")},
    summary="Bulk verify reports (admin only)",
)
@api_view(["POST"])
@permission_classes([IsAdminRole])
def reports_bulk_verify(request):
    ids = request.data.get("ids", [])
    if not isinstance(ids, list) or not ids:
        return Response({"detail": "Provide a non-empty list of report IDs."}, status=400)

    reports = WasteReport.objects.filter(pk__in=ids, status="pending")
    count = reports.count()
    bonus_pts = get_points("verification_bonus", fallback=10)

    for report in reports.select_related("user"):
        report.status = "verified"
        report.save(update_fields=["status"])
        Reward.objects.create(
            user=report.user, points_earned=bonus_pts, reward_type="verification_bonus"
        )
        report.user.points += bonus_pts
        report.user.save(update_fields=["points"])
        cache.delete(f"user:profile:{report.user.pk}")

    cache.delete("leaderboard:top20")
    return Response({"verified": count})


@extend_schema(
    tags=["admin-reports"],
    request=None,
    responses={200: OpenApiResponse(description="Number of reports rejected")},
    summary="Bulk reject reports (admin only)",
)
@api_view(["POST"])
@permission_classes([IsAdminRole])
def reports_bulk_reject(request):
    ids = request.data.get("ids", [])
    reason = request.data.get("reason", "")
    if not isinstance(ids, list) or not ids:
        return Response({"detail": "Provide a non-empty list of report IDs."}, status=400)

    from core.notifications import notify

    reports = WasteReport.objects.filter(pk__in=ids, status="pending").select_related("user")
    count = 0
    for report in reports:
        report.status = "rejected"
        report.rejection_reason = reason
        report.save(update_fields=["status", "rejection_reason"])
        _vprefs = getattr(report.user, "notification_preferences", {}) or {}
        if _vprefs.get("report_notifications", True):
            notify(
                report.user,
                "rejection",
                "Report not accepted",
                f"Your waste report was not accepted.{' Reason: ' + reason if reason else ''}",
                f"/reports/{report.pk}",
                title_rw="Raporo ntiyemewe",
                body_rw=f"Raporo yawe y'imyanda ntiyemewe.{' Impamvu: ' + reason if reason else ''}",
            )
        count += 1

    return Response({"rejected": count, "reason": reason})


@extend_schema(
    tags=["admin-reports"],
    responses={200: OpenApiResponse(description="CSV file download")},
    summary="Export all reports as CSV (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def reports_export(request):
    _log_export(request, "reports.csv")
    qs = WasteReport.objects.select_related("user").order_by("-created_at")

    header = [
        "id",
        "user_email",
        "latitude",
        "longitude",
        "waste_type",
        "status",
        "description",
        "created_at",
    ]

    def rows():
        for r in qs.iterator():
            yield [
                r.id,
                r.user.email,
                r.latitude,
                r.longitude,
                r.waste_type,
                r.status,
                r.description,
                r.created_at.isoformat(),
            ]

    response = StreamingHttpResponse(_csv_stream(header, rows()), content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="reports.csv"'
    return response


# ── Reward configuration ───────────────────────────────────────────────────────


@extend_schema(
    tags=["admin-configurations"],
    responses={200: PointConfigSerializer(many=True)},
    summary="List point configurations (admin only)",
    methods=["GET"],
)
@extend_schema(
    tags=["admin-configurations"],
    request=PointConfigSerializer,
    responses={201: PointConfigSerializer},
    summary="Create a point configuration (admin only)",
    methods=["POST"],
)
@api_view(["GET", "POST"])
@permission_classes([IsAdminRole])
def point_config_list_create(request):
    if request.method == "POST":
        serializer = PointConfigSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        obj = serializer.save()
        bust_points_cache(obj.event)
        return Response(PointConfigSerializer(obj).data, status=status.HTTP_201_CREATED)
    return Response(PointConfigSerializer(PointConfiguration.objects.all(), many=True).data)


@extend_schema(
    tags=["admin-configurations"],
    request=PointConfigSerializer,
    responses={200: PointConfigSerializer},
    summary="Update a point configuration (admin only)",
    methods=["PATCH"],
)
@extend_schema(
    tags=["admin-configurations"],
    responses={204: None},
    summary="Delete a point configuration (admin only)",
    methods=["DELETE"],
)
@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAdminRole])
def point_config_detail(request, pk):
    try:
        obj = PointConfiguration.objects.get(pk=pk)
    except PointConfiguration.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method == "PATCH":
        serializer = PointConfigSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        bust_points_cache(obj.event)
        return Response(serializer.data)

    return Response(PointConfigSerializer(obj).data)


@extend_schema(
    tags=["admin-configurations"],
    responses={200: BadgeDefinitionSerializer(many=True)},
    summary="List badge definitions (admin only)",
    methods=["GET"],
)
@extend_schema(
    tags=["admin-configurations"],
    request=BadgeDefinitionSerializer,
    responses={201: BadgeDefinitionSerializer},
    summary="Create a badge definition (admin only)",
    methods=["POST"],
)
@api_view(["GET", "POST"])
@permission_classes([IsAdminRole])
def badge_list_create(request):
    if request.method == "POST":
        serializer = BadgeDefinitionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        obj = serializer.save()
        return Response(BadgeDefinitionSerializer(obj).data, status=status.HTTP_201_CREATED)
    return Response(BadgeDefinitionSerializer(BadgeDefinition.objects.all(), many=True).data)


@extend_schema(
    tags=["admin-configurations"],
    request=BadgeDefinitionSerializer,
    responses={200: BadgeDefinitionSerializer},
    summary="Update a badge definition (admin only)",
    methods=["PATCH"],
)
@extend_schema(
    tags=["admin-configurations"],
    responses={204: None},
    summary="Delete a badge definition (admin only)",
    methods=["DELETE"],
)
@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAdminRole])
def badge_detail(request, pk):
    try:
        obj = BadgeDefinition.objects.get(pk=pk)
    except BadgeDefinition.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method == "PATCH":
        serializer = BadgeDefinitionSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    return Response(BadgeDefinitionSerializer(obj).data)


# ── Admin user management ──────────────────────────────────────────────────────


class AdminUserSerializer(serializers.ModelSerializer):
    report_count = serializers.SerializerMethodField()
    is_recently_active = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "phone_number",
            "sector",
            "role",
            "points",
            "is_active",
            "is_recently_active",
            "email_verified",
            "current_streak",
            "created_at",
            "report_count",
        ]
        read_only_fields = ["id", "email", "username", "points", "created_at", "report_count"]

    def get_report_count(self, obj):
        # List endpoint annotates as report_count_ann for efficiency.
        # Detail endpoint fetches a plain object, so fall back to a direct count.
        if hasattr(obj, "report_count_ann"):
            return obj.report_count_ann
        return obj.reports.count()

    def get_is_recently_active(self, obj) -> bool:
        """True if the user has had any activity in the last 30 days or joined within 30 days."""
        cutoff = (timezone.now() - timedelta(days=30)).date()
        if obj.last_activity_date and obj.last_activity_date >= cutoff:
            return True
        return obj.date_joined >= timezone.now() - timedelta(days=30)


@extend_schema(
    tags=["admin-users"],
    responses={200: AdminUserSerializer(many=True)},
    summary="List all users (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_users_list(request):
    search = request.query_params.get("search", "")
    role = request.query_params.get("role", "")
    sector = request.query_params.get("sector", "")
    verified = request.query_params.get("verified", "")
    has_activity = request.query_params.get("has_activity", "")

    qs = User.objects.annotate(report_count_ann=Count("reports")).order_by("-created_at")

    if search:
        qs = qs.filter(
            Q(full_name__icontains=search)
            | Q(email__icontains=search)
            | Q(phone_number__icontains=search)
        )
    if role:
        qs = qs.filter(role=role)
    if sector:
        qs = qs.filter(sector__iexact=sector)
    if verified == "true":
        qs = qs.filter(email_verified=True)
    elif verified == "false":
        qs = qs.filter(email_verified=False)
    if has_activity == "true":
        qs = qs.filter(report_count_ann__gt=0)

    paginator = StandardPagination()
    page = paginator.paginate_queryset(qs, request)
    items = page if page is not None else list(qs)
    data = AdminUserSerializer(items, many=True).data
    if page is not None:
        return paginator.get_paginated_response(data)
    return Response(data)


@extend_schema(
    tags=["admin-users"],
    responses={200: OpenApiResponse(description="CSV file download")},
    summary="Export all users as CSV (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_users_export(request):
    _log_export(request, "users.csv")
    qs = User.objects.annotate(report_count_ann=Count("reports")).order_by("-date_joined")
    header = [
        "id",
        "email",
        "full_name",
        "role",
        "sector",
        "points",
        "is_active",
        "email_verified",
        "created_at",
    ]

    def rows():
        for u in qs.iterator():
            yield [
                u.id,
                u.email,
                u.full_name,
                u.role,
                u.sector,
                u.points,
                u.is_active,
                u.email_verified,
                u.date_joined.isoformat(),
            ]

    response = StreamingHttpResponse(_csv_stream(header, rows()), content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="users.csv"'
    return response


@extend_schema(
    tags=["admin-users"],
    request=AdminUserSerializer,
    responses={200: AdminUserSerializer},
    summary="Update a user (role / is_active) (admin only)",
    methods=["PATCH"],
)
@extend_schema(
    tags=["admin-users"],
    responses={204: None},
    summary="Soft-delete (suspend) a user (admin only)",
    methods=["DELETE"],
)
@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAdminRole])
def admin_user_detail(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method == "PATCH":
        allowed = {"role", "is_active"}
        data = {k: v for k, v in request.data.items() if k in allowed}
        for field, val in data.items():
            setattr(user, field, val)
        user.save(update_fields=list(data.keys()))
        serializer = AdminUserSerializer(user)
        return Response(serializer.data)

    serializer = AdminUserSerializer(user)
    return Response(serializer.data)
