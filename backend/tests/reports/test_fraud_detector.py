"""Tests for algorithmic fraud detection."""

import hashlib
from datetime import timedelta
from unittest.mock import MagicMock, patch

import pytest
from django.utils import timezone

from reports.fraud_detector import (
    _VELOCITY_LIMIT,
    _haversine_m,
    check,
    compute_image_hash,
    pre_check,
)
from tests.factories import UserFactory, WasteReportFactory

# ── _haversine_m ──────────────────────────────────────────────────────────────


def test_haversine_same_point_is_zero():
    assert _haversine_m(-1.944, 30.062, -1.944, 30.062) == pytest.approx(0.0, abs=1e-6)


def test_haversine_short_distance():
    # 0.001° latitude ≈ 111 m
    dist = _haversine_m(0.0, 0.0, 0.001, 0.0)
    assert 100 < dist < 120


def test_haversine_is_symmetric():
    a = _haversine_m(0.0, 0.0, 1.0, 1.0)
    b = _haversine_m(1.0, 1.0, 0.0, 0.0)
    assert a == pytest.approx(b, rel=1e-9)


# ── compute_image_hash ────────────────────────────────────────────────────────


def test_compute_image_hash_returns_md5():
    content = b"fake image bytes"
    expected = hashlib.md5(content).hexdigest()
    mock_resp = MagicMock()
    mock_resp.content = content
    with patch("reports.fraud_detector.requests.get", return_value=mock_resp):
        result = compute_image_hash("http://example.com/img.jpg")
    assert result == expected


def test_compute_image_hash_returns_empty_on_failure():
    with patch("reports.fraud_detector.requests.get", side_effect=Exception("timeout")):
        result = compute_image_hash("http://example.com/img.jpg")
    assert result == ""


# ── pre_check ─────────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_pre_check_no_flags_on_fresh_user():
    user = UserFactory(email_verified=True)
    assert pre_check(user, image_hash="abc123", lat=-1.944, lng=30.062) == []


@pytest.mark.django_db
def test_pre_check_detects_duplicate_location():
    user = UserFactory(email_verified=True)
    WasteReportFactory(user=user, latitude=-1.9441, longitude=30.0619)
    flags = pre_check(user, image_hash="", lat=-1.9441, lng=30.0619)
    assert "duplicate_location" in flags


@pytest.mark.django_db
def test_pre_check_no_duplicate_when_far_away():
    user = UserFactory(email_verified=True)
    WasteReportFactory(user=user, latitude=-1.0, longitude=30.0)
    flags = pre_check(user, image_hash="", lat=-1.9441, lng=30.0619)
    assert "duplicate_location" not in flags


@pytest.mark.django_db
def test_pre_check_skips_location_when_no_coords():
    user = UserFactory(email_verified=True)
    # A nearby existing report — but coords are 0.0 so the check is skipped
    WasteReportFactory(user=user, latitude=-1.9441, longitude=30.0619)
    flags = pre_check(user, image_hash="", lat=0.0, lng=0.0)
    assert "duplicate_location" not in flags


@pytest.mark.django_db
def test_pre_check_detects_high_velocity():
    user = UserFactory(email_verified=True)
    now = timezone.now()
    for _ in range(_VELOCITY_LIMIT):
        r = WasteReportFactory(user=user, latitude=-1.0, longitude=29.0)
        type(r).objects.filter(pk=r.pk).update(created_at=now - timedelta(minutes=10))
    flags = pre_check(user, image_hash="", lat=0.0, lng=0.0)
    assert "high_velocity" in flags


@pytest.mark.django_db
def test_pre_check_no_high_velocity_when_under_limit():
    user = UserFactory(email_verified=True)
    now = timezone.now()
    for _ in range(_VELOCITY_LIMIT - 1):
        r = WasteReportFactory(user=user, latitude=-1.0, longitude=29.0)
        type(r).objects.filter(pk=r.pk).update(created_at=now - timedelta(minutes=10))
    flags = pre_check(user, image_hash="", lat=0.0, lng=0.0)
    assert "high_velocity" not in flags


@pytest.mark.django_db
def test_pre_check_detects_duplicate_image():
    user = UserFactory(email_verified=True)
    img_hash = "deadbeefdeadbeef"
    WasteReportFactory(image_hash=img_hash)
    flags = pre_check(user, image_hash=img_hash, lat=0.0, lng=0.0)
    assert "duplicate_image" in flags


@pytest.mark.django_db
def test_pre_check_no_duplicate_image_when_hash_empty():
    user = UserFactory(email_verified=True)
    flags = pre_check(user, image_hash="", lat=0.0, lng=0.0)
    assert "duplicate_image" not in flags


# ── check (post-save) ─────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_check_no_flags_on_isolated_report():
    report = WasteReportFactory(latitude=-1.944, longitude=30.062)
    assert check(report) == []


@pytest.mark.django_db
def test_check_detects_duplicate_location():
    user = UserFactory(email_verified=True)
    WasteReportFactory(user=user, latitude=-1.9441, longitude=30.0619)
    report = WasteReportFactory(user=user, latitude=-1.9441, longitude=30.0619)
    assert "duplicate_location" in check(report)


@pytest.mark.django_db
def test_check_no_duplicate_location_on_self():
    # The check excludes the report's own pk, so a single report is never a dup of itself
    report = WasteReportFactory(latitude=-1.9441, longitude=30.0619)
    assert "duplicate_location" not in check(report)


@pytest.mark.django_db
def test_check_detects_high_velocity():
    user = UserFactory(email_verified=True)
    now = timezone.now()
    reports = []
    for _ in range(_VELOCITY_LIMIT + 1):
        r = WasteReportFactory(user=user, latitude=-1.0, longitude=29.0)
        type(r).objects.filter(pk=r.pk).update(created_at=now - timedelta(minutes=5))
        reports.append(r)
    assert "high_velocity" in check(reports[-1])


@pytest.mark.django_db
def test_check_detects_duplicate_image():
    user = UserFactory(email_verified=True)
    img_hash = "cafebabecafebabe"
    WasteReportFactory(user=user, image_hash=img_hash)
    report = WasteReportFactory(user=user, image_hash=img_hash)
    assert "duplicate_image" in check(report)


@pytest.mark.django_db
def test_check_no_duplicate_image_when_hash_blank():
    report = WasteReportFactory(image_hash="")
    assert "duplicate_image" not in check(report)
