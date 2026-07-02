"""Tests for reports endpoints."""

import pytest

from reports.models import Reward, WasteReport
from tests.factories import UserFactory, WasteReportFactory

# ── POST /api/v1/reports/ ────────────────────────────────────────────────────


@pytest.mark.django_db
def test_submit_report_creates_201(authed_client):
    client, user = authed_client
    payload = {
        "latitude": -1.9441,
        "longitude": 30.0619,
        "waste_type": "bottles",
        "description": "Lots of plastic near the road.",
    }
    response = client.post("/api/v1/reports/", payload, format="json")
    assert response.status_code == 201


@pytest.mark.django_db
def test_submit_report_awards_points(authed_client):
    client, user = authed_client
    old_points = user.points
    payload = {
        "latitude": -1.9441,
        "longitude": 30.0619,
        "waste_type": "bottles",
    }
    client.post("/api/v1/reports/", payload, format="json")
    user.refresh_from_db()
    assert user.points > old_points


@pytest.mark.django_db
def test_submit_report_creates_reward_row(authed_client):
    client, user = authed_client
    payload = {
        "latitude": -1.9441,
        "longitude": 30.0619,
        "waste_type": "bags",
    }
    client.post("/api/v1/reports/", payload, format="json")
    assert Reward.objects.filter(user=user, reward_type="report_submitted").exists()


@pytest.mark.django_db
def test_submit_report_unauthenticated_returns_401(api_client):
    payload = {"latitude": -1.9441, "longitude": 30.0619, "waste_type": "bottles"}
    response = api_client.post("/api/v1/reports/", payload, format="json")
    assert response.status_code == 401


# ── GET /api/v1/reports/ with bbox ────────────────────────────────────────────


@pytest.mark.django_db
def test_get_reports_bbox_filter_returns_in_box(authed_client):
    client, user = authed_client
    # Report inside the bbox
    WasteReportFactory(user=user, latitude=-1.94, longitude=30.06)
    # Report outside the bbox
    WasteReportFactory(user=user, latitude=0.0, longitude=0.0)

    # Tiny bbox that covers only the first report (small enough to pass area check)
    response = client.get(
        "/api/v1/reports/",
        {
            "north": -1.93,
            "south": -1.95,
            "east": 30.07,
            "west": 30.05,
        },
    )
    assert response.status_code == 200
    # Check structure — paginated response contains 'results' key
    data = response.data
    if "results" in data:
        results = data["results"]
    else:
        results = data
    lats = [r["latitude"] for r in results]
    assert -1.94 in lats
    assert 0.0 not in lats


@pytest.mark.django_db
def test_get_reports_bbox_too_large_returns_400(authed_client):
    client, _ = authed_client
    # Bounding box > 100 km²: span of ~10° lat × 10° lon >> 100 km²
    response = client.get(
        "/api/v1/reports/",
        {
            "north": 5.0,
            "south": -5.0,
            "east": 35.0,
            "west": 25.0,
        },
    )
    assert response.status_code == 400


# ── Verify / Reject (admin only) ──────────────────────────────────────────────


@pytest.mark.django_db
def test_verify_report_by_admin_returns_200(admin_client, citizen_user):
    admin_c, admin = admin_client
    report = WasteReportFactory(user=citizen_user, status="pending")
    response = admin_c.patch(f"/api/v1/reports/{report.pk}/verify/")
    assert response.status_code == 200
    report.refresh_from_db()
    assert report.status == "verified"


@pytest.mark.django_db
def test_verify_report_creates_bonus_reward(admin_client, citizen_user):
    admin_c, admin = admin_client
    report = WasteReportFactory(user=citizen_user, status="pending")
    admin_c.patch(f"/api/v1/reports/{report.pk}/verify/")
    assert Reward.objects.filter(user=citizen_user, reward_type="verification_bonus").exists()


@pytest.mark.django_db
def test_verify_report_by_citizen_returns_403(authed_client):
    client, user = authed_client
    report = WasteReportFactory(user=user, status="pending")
    response = client.patch(f"/api/v1/reports/{report.pk}/verify/")
    assert response.status_code == 403


@pytest.mark.django_db
def test_reject_report_by_admin_returns_200(admin_client, citizen_user):
    admin_c, admin = admin_client
    report = WasteReportFactory(user=citizen_user, status="pending")
    response = admin_c.patch(
        f"/api/v1/reports/{report.pk}/reject/",
        {"reason": "Not a valid waste site."},
        format="json",
    )
    assert response.status_code == 200
    report.refresh_from_db()
    assert report.status == "rejected"


@pytest.mark.django_db
def test_reject_report_by_citizen_returns_403(authed_client):
    client, user = authed_client
    report = WasteReportFactory(user=user, status="pending")
    response = client.patch(
        f"/api/v1/reports/{report.pk}/reject/",
        {"reason": "trying to reject own report"},
        format="json",
    )
    assert response.status_code == 403


# ── Leaderboard ───────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_leaderboard_returns_200(authed_client):
    client, _ = authed_client
    response = client.get("/api/v1/leaderboard/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_leaderboard_returns_list(authed_client):
    client, _ = authed_client
    response = client.get("/api/v1/leaderboard/")
    assert isinstance(response.data, list)


# ── DELETE /api/v1/reports/{pk}/ ─────────────────────────────────────────────


@pytest.mark.django_db
def test_delete_report_by_owner_soft_deletes(authed_client):
    client, user = authed_client
    report = WasteReportFactory(user=user)
    pk = report.pk
    response = client.delete(f"/api/v1/reports/{pk}/")
    assert response.status_code == 204
    # Should not appear in default queryset
    assert not WasteReport.objects.filter(pk=pk).exists()
    # But still in all_objects (soft delete)
    assert WasteReport.all_objects.filter(pk=pk).exists()
    WasteReport.all_objects.get(pk=pk)
    assert WasteReport.all_objects.get(pk=pk).is_deleted is True


@pytest.mark.django_db
def test_delete_report_by_other_user_returns_403(authed_client):
    client, user = authed_client
    other_user = UserFactory()
    report = WasteReportFactory(user=other_user)
    response = client.delete(f"/api/v1/reports/{report.pk}/")
    assert response.status_code == 403


# ── GET /api/v1/reports/ list ────────────────────────────────────────────────


@pytest.mark.django_db
def test_list_reports_returns_200(authed_client):
    client, user = authed_client
    WasteReportFactory(user=user)
    response = client.get("/api/v1/reports/")
    assert response.status_code == 200
