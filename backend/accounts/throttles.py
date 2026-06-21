from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthThrottle(AnonRateThrottle):
    """5 requests/minute per IP — applied to login, register, and verify endpoints."""

    scope = "auth"


class GoogleAuthThrottle(AnonRateThrottle):
    """10 requests/minute per IP — applied to Google OAuth endpoints."""

    scope = "google_auth"


class ReportSubmitThrottle(UserRateThrottle):
    """10 report submissions per hour per authenticated user."""

    scope = "report_submit"


class RecyclingLogThrottle(UserRateThrottle):
    """20 recycling activity logs per day per authenticated user."""

    scope = "recycling_log"


class MapBboxThrottle(UserRateThrottle):
    """60 bbox map fetches per hour per authenticated user."""

    scope = "map_bbox"
