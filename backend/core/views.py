import time

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

_START_TIME = time.time()


@extend_schema(
    tags=["health"],
    summary="Service health check",
    responses={200: None},
)
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Returns 200 with db, cache, and uptime info. Used by Docker and Render."""
    db_status = _check_db()
    cache_status = _check_cache()

    return Response(
        {
            "status": "ok",
            "db": db_status,
            "cache": cache_status,
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
