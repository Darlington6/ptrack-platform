"""
Algorithmic fraud detection for waste reports.

Three checks run on every new submission:
  1. duplicate_location — same user submitted another report within 50 m in the last 24 h
  2. high_velocity      — user submitted more than 5 reports in the last hour
  3. duplicate_image    — uploaded image has the same MD5 hash as a prior report

Returns a (possibly empty) list of flag codes. The view stores them on the
report and marks is_flagged=True so admins can prioritise review.
"""

import hashlib
import logging
from datetime import timedelta
from math import atan2, cos, radians, sin, sqrt

import requests
from django.utils import timezone

logger = logging.getLogger(__name__)

_DUPLICATE_RADIUS_M = 50
_DUPLICATE_WINDOW_H = 24
_VELOCITY_LIMIT = 5
_VELOCITY_WINDOW_H = 1


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return the distance in metres between two lat/lon points."""
    lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    R = 6_371_000
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlam = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlam / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def compute_image_hash(image_url: str) -> str:
    """
    Download the image and return its MD5 hex digest.
    Returns an empty string if the download fails.
    """
    try:
        resp = requests.get(image_url, timeout=10)
        resp.raise_for_status()
        return hashlib.md5(resp.content).hexdigest()
    except Exception as exc:
        logger.warning("Could not hash image %s: %s", image_url, exc)
        return ""


def pre_check(user, image_hash: str, lat: float, lng: float) -> list[str]:
    """
    Run all fraud checks BEFORE a report is saved, for pre-submission citizen warnings.
    Uses >= VELOCITY_LIMIT (not >) because the pending report is not yet counted.
    """
    from .models import WasteReport

    flags: list[str] = []
    now = timezone.now()

    # 1. Duplicate location (only if real coordinates provided)
    if lat and lng:
        cutoff_24h = now - timedelta(hours=_DUPLICATE_WINDOW_H)
        recent_coords = WasteReport.objects.filter(
            user=user, created_at__gte=cutoff_24h
        ).values_list("latitude", "longitude")
        for r_lat, r_lon in recent_coords:
            if _haversine_m(lat, lng, r_lat, r_lon) < _DUPLICATE_RADIUS_M:
                flags.append("duplicate_location")
                break

    # 2. High velocity — >= limit because the pending report isn't saved yet
    cutoff_1h = now - timedelta(hours=_VELOCITY_WINDOW_H)
    recent_count = WasteReport.objects.filter(user=user, created_at__gte=cutoff_1h).count()
    if recent_count >= _VELOCITY_LIMIT:
        flags.append("high_velocity")

    # 3. Duplicate image
    if image_hash and WasteReport.objects.filter(image_hash=image_hash).exists():
        flags.append("duplicate_image")

    return flags


def check(report) -> list[str]:
    """
    Run all fraud checks on a newly saved WasteReport instance.
    The report must already have image_hash populated before calling this.
    Returns a list of triggered flag codes (may be empty).
    """
    from .models import WasteReport

    flags: list[str] = []
    now = timezone.now()

    # 1. Duplicate location
    cutoff_24h = now - timedelta(hours=_DUPLICATE_WINDOW_H)
    recent_coords = (
        WasteReport.objects.filter(user=report.user, created_at__gte=cutoff_24h)
        .exclude(pk=report.pk)
        .values_list("latitude", "longitude")
    )
    for lat, lon in recent_coords:
        if _haversine_m(report.latitude, report.longitude, lat, lon) < _DUPLICATE_RADIUS_M:
            flags.append("duplicate_location")
            break

    # 2. High velocity
    cutoff_1h = now - timedelta(hours=_VELOCITY_WINDOW_H)
    recent_count = WasteReport.objects.filter(user=report.user, created_at__gte=cutoff_1h).count()
    if recent_count > _VELOCITY_LIMIT:
        flags.append("high_velocity")

    # 3. Duplicate image
    if report.image_hash:
        duplicate_exists = (
            WasteReport.objects.filter(image_hash=report.image_hash).exclude(pk=report.pk).exists()
        )
        if duplicate_exists:
            flags.append("duplicate_image")

    return flags
