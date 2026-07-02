"""Tests for core notifications: notify() helper and REST endpoints."""

import pytest

from core.models import Notification
from core.notifications import notify
from tests.factories import UserFactory


# ── notify() helper ───────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_notify_creates_notification_row():
    user = UserFactory()
    notify(user, "system", "Test Title", "Test body text.", "/test")
    assert Notification.objects.filter(recipient=user).count() == 1


@pytest.mark.django_db
def test_notify_stores_correct_fields():
    user = UserFactory()
    notify(user, "badge_earned", "You earned a badge!", "Congrats.", "/rewards")
    n = Notification.objects.get(recipient=user)
    assert n.category == "badge_earned"
    assert n.title == "You earned a badge!"
    assert n.body == "Congrats."
    assert n.action_url == "/rewards"
    assert n.is_read is False


@pytest.mark.django_db
def test_notify_does_not_raise_on_invalid_category():
    """notify() swallows exceptions — even an invalid category should not raise."""
    user = UserFactory()
    # 'report' is not in CATEGORY_CHOICES, but notify() silently catches DB errors
    # This matches the real usage in reports/views.py which uses "report" category
    # Let's verify it either succeeds or fails silently (no exception raised)
    try:
        notify(user, "report", "Title", "Body", "/")
    except Exception:
        pytest.fail("notify() should never raise")


# ── GET /api/v1/notifications/ ───────────────────────────────────────────────


@pytest.mark.django_db
def test_list_notifications_authenticated_returns_200(authed_client):
    client, user = authed_client
    response = client.get("/api/v1/notifications/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_list_notifications_unauthenticated_returns_401(api_client):
    response = api_client.get("/api/v1/notifications/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_list_notifications_returns_user_notifications_only(authed_client):
    client, user = authed_client
    other_user = UserFactory()
    notify(user, "system", "For me", "Body", "/")
    notify(other_user, "system", "Not for me", "Body", "/")

    response = client.get("/api/v1/notifications/")
    assert response.status_code == 200
    data = response.data
    # Handle cursor pagination structure
    if "results" in data:
        results = data["results"]
    else:
        results = data.get("results", [])

    titles = [n["title"] for n in results]
    assert "For me" in titles
    assert "Not for me" not in titles


# ── POST /api/v1/notifications/{pk}/read/ ────────────────────────────────────


@pytest.mark.django_db
def test_mark_notification_read_returns_200(authed_client):
    client, user = authed_client
    notify(user, "system", "Title", "Body", "/")
    n = Notification.objects.get(recipient=user)
    response = client.post(f"/api/v1/notifications/{n.pk}/read/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_mark_notification_read_sets_is_read_true(authed_client):
    client, user = authed_client
    notify(user, "system", "Title", "Body", "/")
    n = Notification.objects.get(recipient=user)
    client.post(f"/api/v1/notifications/{n.pk}/read/")
    n.refresh_from_db()
    assert n.is_read is True


@pytest.mark.django_db
def test_mark_notification_read_other_user_returns_404(authed_client):
    client, user = authed_client
    other_user = UserFactory()
    notify(other_user, "system", "Not yours", "Body", "/")
    n = Notification.objects.get(recipient=other_user)
    response = client.post(f"/api/v1/notifications/{n.pk}/read/")
    assert response.status_code == 404