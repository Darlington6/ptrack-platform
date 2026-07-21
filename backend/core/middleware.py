# Middleware: idempotency key deduplication and audit logging.
import json
import logging
import re

from django.core.cache import cache
from django.http import HttpResponse

logger = logging.getLogger(__name__)

_IDEMPOTENCY_TTL = 86_400  # 24 hours
_IDEMPOTENCY_METHODS = frozenset({"POST", "PUT", "PATCH"})


class IdempotencyMiddleware:
    """
    Prevents duplicate state-changing requests from being processed twice.

    When a client sends X-Idempotency-Key on a POST/PUT/PATCH request, the
    middleware caches the first successful response in Redis.  Subsequent
    requests with the same key + same authenticated user return the cached
    response immediately without hitting the view or the database.

    The key is scoped to the authenticated user so two different users can
    coincidentally reuse the same UUID without colliding.

    Gracefully degrades when Redis is unavailable (IGNORE_EXCEPTIONS=True in
    the cache config): cache.get returns None and the request is processed
    normally — no duplicate suppression but also no failure.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        idem_key = request.META.get("HTTP_X_IDEMPOTENCY_KEY")

        # Only intercept state-changing requests from authenticated users
        if (
            idem_key
            and request.method in _IDEMPOTENCY_METHODS
            and hasattr(request, "user")
            and request.user.is_authenticated
        ):
            cache_key = f"idem:{request.user.pk}:{idem_key}"
            cached = cache.get(cache_key)
            if cached is not None:
                resp = HttpResponse(
                    content=cached["body"],
                    status=cached["status"],
                    content_type=cached.get("content_type", "application/json"),
                )
                resp["X-Idempotency-Replayed"] = "true"
                return resp

            response = self.get_response(request)

            # Cache only successful responses; don't cache validation errors or
            # server errors — the client should be able to retry those freely.
            if 200 <= response.status_code < 300:
                try:
                    cache.set(
                        cache_key,
                        {
                            "body": response.content,
                            "status": response.status_code,
                            "content_type": response.get("Content-Type", "application/json"),
                        },
                        timeout=_IDEMPOTENCY_TTL,
                    )
                except Exception:
                    logger.exception("IdempotencyMiddleware failed to cache response")
            return response

        return self.get_response(request)


_SENSITIVE_KEYS = frozenset({"password", "confirm_password", "token", "refresh", "access"})

# Ordered most-specific first so that e.g. /admin/recycling-centres/5/ matches the
# integer-ID rule before the type-only /recycling-centres/ fallback.
# Patterns with a capturing group (\d+) populate target_id; others leave it None.
_TARGET_RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"/reports/(\d+)"), "WasteReport"),
    (re.compile(r"/admin/users/(\d+)"), "User"),
    (re.compile(r"/admin/recycling-centres/(\d+)"), "RecyclingCentre"),
    (re.compile(r"/admin/configurations/points/(\d+)"), "PointConfiguration"),
    (re.compile(r"/admin/configurations/badges/(\d+)"), "BadgeDefinition"),
    (re.compile(r"/admin/audit-logs/(\d+)"), "AuditLog"),
    (re.compile(r"/notifications/(\d+)"), "Notification"),
    (re.compile(r"/recycling-centres/(\d+)"), "RecyclingCentre"),
    # Type-only: list/create, bulk, and slug-based routes
    (re.compile(r"/admin/reports/"), "WasteReport"),
    (re.compile(r"/reports/"), "WasteReport"),
    (re.compile(r"/admin/recycling-centres/"), "RecyclingCentre"),
    (re.compile(r"/recycling-centres/"), "RecyclingCentre"),
    (re.compile(r"/admin/users/"), "User"),
    (re.compile(r"/admin/configurations/points"), "PointConfiguration"),
    (re.compile(r"/admin/configurations/badges"), "BadgeDefinition"),
    (re.compile(r"/education/articles/"), "Article"),
    (re.compile(r"/recycling/"), "RecyclingActivity"),
    (re.compile(r"/notifications/"), "Notification"),
]


def _extract_target(path: str) -> tuple[str, int | None]:
    for pattern, model_name in _TARGET_RULES:
        m = pattern.search(path)
        if m:
            target_id = int(m.group(1)) if m.lastindex else None
            return model_name, target_id
    return "", None


def _sanitise_body(raw: bytes) -> dict:
    try:
        body = json.loads(raw or b"{}")
    except (ValueError, UnicodeDecodeError):
        return {}
    if isinstance(body, dict):
        return {k: ("***" if k in _SENSITIVE_KEYS else v) for k, v in body.items()}
    return {}


def _get_client_ip(request) -> str | None:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class AuditLogMiddleware:
    """
    Logs state-changing requests made by admin users (or to /api/v1/ admin paths)
    to the AuditLog table. Runs after the response is generated so the status
    code is available.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Cache body before the view consumes the stream
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            request._audit_body = request.body  # reading here is safe pre-view
        else:
            request._audit_body = b""

        response = self.get_response(request)

        self._maybe_log(request, response)
        return response

    def _maybe_log(self, request, response) -> None:
        if request.method not in ("POST", "PUT", "PATCH", "DELETE"):
            return

        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return

        is_admin_user = getattr(user, "role", None) == "admin"
        is_admin_path = request.path.startswith("/api/v1/admin/")

        if not (is_admin_user or is_admin_path):
            return

        try:
            from .models import AuditLog

            target_type, target_id = _extract_target(request.path)
            AuditLog.objects.create(
                actor=user,
                action=f"{request.method} {request.path}",
                target_type=target_type,
                target_id=target_id,
                metadata={
                    "body": _sanitise_body(getattr(request, "_audit_body", b"")),
                    "status_code": response.status_code,
                    "query_string": request.META.get("QUERY_STRING", ""),
                },
                ip_address=_get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )
        except Exception:
            logger.exception("AuditLogMiddleware failed to write log entry")
