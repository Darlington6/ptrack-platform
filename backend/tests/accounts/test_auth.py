"""Tests for accounts authentication endpoints."""

import pytest
from django.contrib.auth import get_user_model

from tests.factories import UserFactory

User = get_user_model()


# ── Registration ──────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_register_creates_user(api_client):
    payload = {
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "securepass123",
        "confirm_password": "securepass123",
    }
    response = api_client.post("/api/v1/auth/register/", payload, format="json")
    assert response.status_code == 201
    assert User.objects.filter(email="newuser@example.com").exists()


@pytest.mark.django_db
def test_register_returns_tokens(api_client):
    payload = {
        "email": "tokentest@example.com",
        "username": "tokentest",
        "password": "securepass123",
        "confirm_password": "securepass123",
    }
    response = api_client.post("/api/v1/auth/register/", payload, format="json")
    assert response.status_code == 201
    data = response.data
    assert "access" in data
    assert "refresh" in data


@pytest.mark.django_db
def test_register_duplicate_email_rejected(api_client):
    UserFactory(email="existing@example.com")
    payload = {
        "email": "existing@example.com",
        "username": "other",
        "password": "securepass123",
        "confirm_password": "securepass123",
    }
    response = api_client.post("/api/v1/auth/register/", payload, format="json")
    assert response.status_code == 400


# ── Login ──────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_login_with_correct_credentials(api_client):
    user = UserFactory(email="loginme@example.com")
    response = api_client.post(
        "/api/v1/auth/login/",
        {"email": "loginme@example.com", "password": "testpass123"},
        format="json",
    )
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_login_with_wrong_password_returns_401(api_client):
    UserFactory(email="badpass@example.com")
    response = api_client.post(
        "/api/v1/auth/login/",
        {"email": "badpass@example.com", "password": "wrongpassword"},
        format="json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_login_nonexistent_user_returns_401(api_client):
    response = api_client.post(
        "/api/v1/auth/login/",
        {"email": "nobody@example.com", "password": "testpass123"},
        format="json",
    )
    assert response.status_code == 401


# ── Me endpoint ───────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_me_authenticated_returns_200(authed_client):
    client, user = authed_client
    response = client.get("/api/v1/auth/me/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_me_returns_email_field(authed_client):
    client, user = authed_client
    response = client.get("/api/v1/auth/me/")
    assert response.status_code == 200
    assert "email" in response.data
    assert response.data["email"] == user.email


@pytest.mark.django_db
def test_me_unauthenticated_returns_401(api_client):
    response = api_client.get("/api/v1/auth/me/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_me_patch_updates_sector(authed_client):
    client, user = authed_client
    response = client.patch(
        "/api/v1/auth/me/", {"sector": "Kicukiro"}, format="json"
    )
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.sector == "Kicukiro"


@pytest.mark.django_db
def test_me_patch_no_updatable_fields_returns_400(authed_client):
    client, user = authed_client
    response = client.patch(
        "/api/v1/auth/me/", {"role": "admin"}, format="json"
    )
    assert response.status_code == 400


# ── Token refresh ─────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_token_refresh_with_valid_refresh(api_client):
    user = UserFactory()
    from rest_framework_simplejwt.tokens import RefreshToken

    refresh = RefreshToken.for_user(user)
    response = api_client.post(
        "/api/v1/auth/refresh/", {"refresh": str(refresh)}, format="json"
    )
    assert response.status_code == 200
    assert "access" in response.data


@pytest.mark.django_db
def test_token_refresh_with_invalid_token_returns_401(api_client):
    response = api_client.post(
        "/api/v1/auth/refresh/", {"refresh": "not-a-real-token"}, format="json"
    )
    assert response.status_code == 401


# ── Google OAuth (mocked) ─────────────────────────────────────────────────────


@pytest.mark.django_db
def test_google_auth_creates_user_on_new_account(api_client, mocker):
    mocker.patch(
        "accounts.views._verify_google_token",
        return_value={
            "sub": "google-sub-123",
            "email": "googleuser@gmail.com",
            "given_name": "Test",
            "family_name": "User",
            "email_verified": True,
        },
    )
    response = api_client.post(
        "/api/v1/auth/google/",
        {"access_token": "fake-google-token"},
        format="json",
    )
    assert response.status_code == 200
    assert User.objects.filter(email="googleuser@gmail.com").exists()


@pytest.mark.django_db
def test_google_auth_logs_in_existing_user(api_client, mocker):
    existing = UserFactory(email="existing_google@gmail.com")
    mocker.patch(
        "accounts.views._verify_google_token",
        return_value={
            "sub": "google-sub-456",
            "email": "existing_google@gmail.com",
            "given_name": "Existing",
            "family_name": "User",
            "email_verified": True,
        },
    )
    response = api_client.post(
        "/api/v1/auth/google/",
        {"access_token": "fake-google-token"},
        format="json",
    )
    assert response.status_code == 200
    assert "access" in response.data


@pytest.mark.django_db
def test_google_auth_invalid_token_returns_400(api_client, mocker):
    mocker.patch(
        "accounts.views._verify_google_token",
        side_effect=ValueError("Invalid or expired Google access token."),
    )
    response = api_client.post(
        "/api/v1/auth/google/",
        {"access_token": "bad-token"},
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_google_auth_missing_token_returns_400(api_client):
    response = api_client.post("/api/v1/auth/google/", {}, format="json")
    assert response.status_code == 400