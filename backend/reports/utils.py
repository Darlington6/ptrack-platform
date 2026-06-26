from django.core.cache import cache

_PTS_CACHE_TTL = 60  # 1 minute — short so config changes take effect quickly


def get_points(event: str, fallback: int = 0) -> int:
    """Return the configured point value for an event, falling back if not configured."""
    key = f"points_config:{event}"
    cached = cache.get(key)
    if cached is not None:
        return cached
    try:
        from .models import PointConfiguration

        pts = PointConfiguration.objects.get(event=event).points
    except Exception:
        pts = fallback
    cache.set(key, pts, timeout=_PTS_CACHE_TTL)
    return pts


def bust_points_cache(event: str) -> None:
    cache.delete(f"points_config:{event}")
