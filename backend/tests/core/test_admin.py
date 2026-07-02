"""Tests for admin-only endpoints."""

import pytest

from tests.factories import UserFactory, WasteReportFactory


# ── GET /api/v1/admin/analytics/kpis/ ────────────────────────────────────────


@pytest.mark.django_db
def test_analytics_kpis_by_admin_returns_200(admin_client):
    client, _ = admin_client
    response = client.get("/api/v1/admin/analytics/kpis/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_analytics_kpis_by_citizen_returns_403(authed_client):
    client, _ = authed_client
    response = client.get("/api/v1/admin/analytics/kpis/")
    assert response.status_code == 403


# ── GET /api/v1/admin/users/ ─────────────────────────────────────────────────


@pytest.mark.django_db
def test_admin_users_list_returns_200(admin_client):
    client, _ = admin_client
    response = client.get("/api/v1/admin/users/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_admin_users_list_has_is_recently_active_field(admin_client):
    client, admin = admin_client
    response = client.get("/api/v1/admin/users/")
    assert response.status_code == 200
    data = response.data
    # Pagination: results is a list inside data
    if "results" in data:
        results = data["results"]
    else:
        results = data
    assert len(results) > 0
    assert "is_recently_active" in results[0]


@pytest.mark.django_db
def test_admin_users_list_by_citizen_returns_403(authed_client):
    client, _ = authed_client
    response = client.get("/api/v1/admin/users/")
    assert response.status_code == 403


# ── POST /api/v1/admin/reports/bulk-verify/ ──────────────────────────────────


@pytest.mark.django_db
def test_bulk_verify_reports_returns_200(admin_client, citizen_user):
    client, admin = admin_client
    report1 = WasteReportFactory(user=citizen_user, status="pending")
    report2 = WasteReportFactory(user=citizen_user, status="pending")
    response = client.post(
        "/api/v1/admin/reports/bulk-verify/",
        {"ids": [report1.pk, report2.pk]},
        format="json",
    )
    assert response.status_code == 200
    assert response.data["verified"] == 2


@pytest.mark.django_db
def test_bulk_verify_updates_report_status(admin_client, citizen_user):
    client, admin = admin_client
    report = WasteReportFactory(user=citizen_user, status="pending")
    client.post(
        "/api/v1/admin/reports/bulk-verify/",
        {"ids": [report.pk]},
        format="json",
    )
    report.refresh_from_db()
    assert report.status == "verified"


@pytest.mark.django_db
def test_bulk_verify_empty_ids_returns_400(admin_client):
    client, _ = admin_client
    response = client.post(
        "/api/v1/admin/reports/bulk-verify/",
        {"ids": []},
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_bulk_verify_by_citizen_returns_403(authed_client, citizen_user):
    client, user = authed_client
    report = WasteReportFactory(user=citizen_user, status="pending")
    response = client.post(
        "/api/v1/admin/reports/bulk-verify/",
        {"ids": [report.pk]},
        format="json",
    )
    assert response.status_code == 403


# ── GET /api/v1/admin/users/export.csv ───────────────────────────────────────


@pytest.mark.django_db
def test_admin_users_export_csv_returns_200(admin_client):
    client, _ = admin_client
    response = client.get("/api/v1/admin/users/export.csv")
    assert response.status_code == 200


@pytest.mark.django_db
def test_admin_users_export_csv_by_citizen_returns_403(authed_client):
    client, _ = authed_client
    response = client.get("/api/v1/admin/users/export.csv")
    assert response.status_code == 403


# ── GET /api/v1/admin/analytics/reports-over-time/ ───────────────────────────


@pytest.mark.django_db
def test_analytics_reports_over_time_returns_200(admin_client):
    client, _ = admin_client
    response = client.get("/api/v1/admin/analytics/reports-over-time/")
    assert response.status_code == 200
    assert "weeks" in response.data


# ── GET /api/v1/admin/analytics/by-sector/ ───────────────────────────────────


@pytest.mark.django_db
def test_analytics_by_sector_returns_200(admin_client):
    client, _ = admin_client
    response = client.get("/api/v1/admin/analytics/by-sector/")
    assert response.status_code == 200


# ── Bulk reject ───────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_bulk_reject_reports_returns_200(admin_client, citizen_user):
    client, admin = admin_client
    report = WasteReportFactory(user=citizen_user, status="pending")
    response = client.post(
        "/api/v1/admin/reports/bulk-reject/",
        {"ids": [report.pk], "reason": "Not valid."},
        format="json",
    )
    assert response.status_code == 200
    assert response.data["rejected"] == 1