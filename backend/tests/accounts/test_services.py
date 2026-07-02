"""Tests for accounts.services — update_streak and compute_impact."""

import datetime

import pytest
from freezegun import freeze_time

from accounts.services import (
    BOTTLES_PER_KG,
    CO2_KG_PER_PLASTIC_KG,
    PLASTIC_KG_PER_RECYCLING,
    PLASTIC_KG_PER_REPORT,
    compute_impact,
    update_streak,
)
from tests.factories import RecyclingActivityFactory, UserFactory, WasteReportFactory


# ── update_streak ─────────────────────────────────────────────────────────────


@pytest.mark.django_db
@freeze_time("2025-06-01")
def test_update_streak_first_call_sets_streak_to_1():
    user = UserFactory(current_streak=0, last_activity_date=None)
    update_streak(user)
    user.refresh_from_db()
    assert user.current_streak == 1
    assert user.last_activity_date == datetime.date(2025, 6, 1)


@pytest.mark.django_db
@freeze_time("2025-06-01")
def test_update_streak_same_day_no_change():
    user = UserFactory(current_streak=3, last_activity_date=datetime.date(2025, 6, 1))
    update_streak(user)
    user.refresh_from_db()
    assert user.current_streak == 3  # unchanged


@pytest.mark.django_db
def test_update_streak_next_day_increments():
    with freeze_time("2025-06-01"):
        user = UserFactory(current_streak=2, last_activity_date=datetime.date(2025, 5, 31))
        update_streak(user)
        user.refresh_from_db()
        assert user.current_streak == 3
        assert user.last_activity_date == datetime.date(2025, 6, 1)


@pytest.mark.django_db
def test_update_streak_gap_resets_to_1():
    with freeze_time("2025-06-05"):
        user = UserFactory(current_streak=10, last_activity_date=datetime.date(2025, 6, 1))
        update_streak(user)
        user.refresh_from_db()
        assert user.current_streak == 1


@pytest.mark.django_db
def test_update_streak_updates_longest_when_exceeded():
    with freeze_time("2025-06-01"):
        user = UserFactory(
            current_streak=5,
            longest_streak=5,
            last_activity_date=datetime.date(2025, 5, 31),
        )
        update_streak(user)
        user.refresh_from_db()
        assert user.current_streak == 6
        assert user.longest_streak == 6


# ── compute_impact ────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_compute_impact_zero_activity():
    user = UserFactory(points=0)
    result = compute_impact(user)
    assert result["total_reports"] == 0
    assert result["total_recycling"] == 0
    assert result["estimated_plastic_kg"] == 0.0
    assert result["co2_saved_kg"] == 0.0
    assert result["estimated_bottles_equivalent"] == 0


@pytest.mark.django_db
def test_compute_impact_known_values():
    user = UserFactory(points=50)
    WasteReportFactory(user=user)
    WasteReportFactory(user=user)
    RecyclingActivityFactory(user=user)

    result = compute_impact(user)

    expected_plastic = round(2 * PLASTIC_KG_PER_REPORT + 1 * PLASTIC_KG_PER_RECYCLING, 2)
    expected_co2 = round(expected_plastic * CO2_KG_PER_PLASTIC_KG, 2)
    expected_bottles = int(expected_plastic * BOTTLES_PER_KG)

    assert result["total_reports"] == 2
    assert result["total_recycling"] == 1
    assert result["estimated_plastic_kg"] == expected_plastic
    assert result["co2_saved_kg"] == expected_co2
    assert result["estimated_bottles_equivalent"] == expected_bottles
    assert result["total_points"] == 50


@pytest.mark.django_db
def test_compute_impact_returns_expected_keys():
    user = UserFactory()
    result = compute_impact(user)
    expected_keys = {
        "total_reports",
        "total_recycling",
        "total_points",
        "estimated_plastic_kg",
        "estimated_bottles_equivalent",
        "co2_saved_kg",
    }
    assert set(result.keys()) == expected_keys