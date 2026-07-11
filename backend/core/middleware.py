import json
import logging
import re

logger = logging.getLogger(__name__)

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
