import pytest
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _disable_throttling(settings):
    """Swap in a dummy cache so throttle counters never accumulate between tests."""
    settings.CACHES = {"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}}


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def citizen_user(db):
    from tests.factories import UserFactory

    return UserFactory(role="citizen", email_verified=True, is_active=True)


@pytest.fixture
def admin_user(db):
    from tests.factories import UserFactory

    return UserFactory(role="admin", email_verified=True, is_active=True)


@pytest.fixture
def authed_client(api_client, citizen_user):
    from rest_framework_simplejwt.tokens import RefreshToken

    token = RefreshToken.for_user(citizen_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    return api_client, citizen_user


@pytest.fixture
def admin_client(api_client, admin_user):
    from rest_framework_simplejwt.tokens import RefreshToken

    token = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    return api_client, admin_user
