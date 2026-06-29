from django.core.cache import cache

SECTOR_CENTROIDS: dict[str, tuple[float, float]] = {
    "Kimironko": (-1.9358, 30.1284),
    "Kacyiru": (-1.9441, 30.0619),
    "Remera": (-1.9547, 30.1122),
    "Gisozi": (-1.9212, 30.0747),
    "Ndera": (-1.8900, 30.1600),
    "Kinyinya": (-1.9000, 30.1300),
    "Nduba": (-1.8800, 30.0900),
    "Rusororo": (-1.8700, 30.1200),
    "Jabana": (-1.8600, 30.1000),
    "Bumbogo": (-1.8800, 30.0600),
    "Nyamirambo": (-1.9803, 30.0458),
    "Nyabugogo": (-1.9388, 30.0499),
    "Kiyovu": (-1.9519, 30.0601),
    "Gikondo": (-1.9752, 30.0842),
    "Kicukiro": (-2.0025, 30.0887),
    "Kanombe": (-1.9685, 30.1389),
}


def coords_to_sector(lat: float, lng: float) -> str:
    """Return the nearest known Kigali sector for the given coordinates."""
    return min(
        SECTOR_CENTROIDS.items(),
        key=lambda item: (item[1][0] - lat) ** 2 + (item[1][1] - lng) ** 2,
    )[0]


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
