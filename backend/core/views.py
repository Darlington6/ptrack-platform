import time

from django.conf import settings
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .pagination import FeedCursorPagination
from .serializers import NotificationSerializer

_START_TIME = time.time()


# ── Health check ───────────────────────────────────────────────────────────────


@extend_schema(
    tags=["health"],
    summary="Service health check",
    responses={200: None},
)
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Returns 200 with db, cache, and uptime info. Used by Docker and Render."""
    return Response(
        {
            "status": "ok",
            "db": _check_db(),
            "cache": _check_cache(),
            "version": getattr(settings, "APP_VERSION", "0.1.0"),
            "uptime_seconds": int(time.time() - _START_TIME),
        }
    )


def _check_db() -> str:
    try:
        from django.db import connection

        connection.ensure_connection()
        return "ok"
    except Exception:
        return "error"


def _check_cache() -> str:
    try:
        from django.core.cache import cache

        cache.set("_health", "1", timeout=5)
        return "ok" if cache.get("_health") == "1" else "error"
    except Exception:
        return "error"


# ── Notifications ──────────────────────────────────────────────────────────────


@extend_schema(
    tags=["notifications"],
    responses={200: NotificationSerializer(many=True)},
    summary="List notifications for the current user (cursor-paginated)",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    """Return cursor-paginated notifications with an ``unread_count`` field."""
    qs = Notification.objects.filter(recipient=request.user)
    unread_count = qs.filter(is_read=False).count()

    paginator = FeedCursorPagination()
    page = paginator.paginate_queryset(qs, request)
    if page is not None:
        response = paginator.get_paginated_response(NotificationSerializer(page, many=True).data)
        response.data["unread_count"] = unread_count
        return response

    return Response(
        {"unread_count": unread_count, "results": NotificationSerializer(qs, many=True).data}
    )


@extend_schema(
    tags=["notifications"],
    responses={200: OpenApiResponse(description="Marked as read")},
    summary="Mark a single notification as read",
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def notification_read(request, pk):
    try:
        n = Notification.objects.get(pk=pk, recipient=request.user)
    except Notification.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if not n.is_read:
        n.is_read = True
        n.read_at = timezone.now()
        n.save(update_fields=["is_read", "read_at"])

    return Response({"detail": "Marked as read."})


@extend_schema(
    tags=["notifications"],
    responses={200: OpenApiResponse(description="All notifications marked as read")},
    summary="Mark all notifications as read",
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def notifications_read_all(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(
        is_read=True, read_at=timezone.now()
    )
    return Response({"detail": "All notifications marked as read."})


@extend_schema(
    tags=["notifications"],
    responses={204: None},
    summary="Delete a notification",
)
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def notification_delete(request, pk):
    try:
        n = Notification.objects.get(pk=pk, recipient=request.user)
    except Notification.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    n.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
