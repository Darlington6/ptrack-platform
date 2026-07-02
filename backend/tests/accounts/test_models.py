"""Tests for accounts.models — User soft-delete, uniqueness, defaults."""

import pytest
from django.db import IntegrityError

from tests.factories import UserFactory


@pytest.mark.django_db
def test_user_email_is_unique():
    UserFactory(email="dup@example.com")
    with pytest.raises(IntegrityError):
        UserFactory(email="dup@example.com")


@pytest.mark.django_db
def test_soft_delete_excludes_from_default_queryset():
    user = UserFactory()
    pk = user.pk
    user.delete()
    from django.contrib.auth import get_user_model

    User = get_user_model()
    assert not User.objects.filter(pk=pk).exists()
    assert User.all_objects.filter(pk=pk).exists()


@pytest.mark.django_db
def test_soft_delete_sets_is_deleted_true():
    user = UserFactory()
    pk = user.pk
    user.delete()
    from django.contrib.auth import get_user_model

    User = get_user_model()
    user_db = User.all_objects.get(pk=pk)
    assert user_db.is_deleted is True
    assert user_db.deleted_at is not None


@pytest.mark.django_db
def test_soft_delete_does_not_remove_from_db():
    user = UserFactory()
    pk = user.pk
    user.delete()
    from django.contrib.auth import get_user_model

    User = get_user_model()
    # still exists via all_objects
    assert User.all_objects.filter(pk=pk).count() == 1


@pytest.mark.django_db
def test_sector_defaults_to_empty_string():
    user = UserFactory()
    assert user.sector == ""