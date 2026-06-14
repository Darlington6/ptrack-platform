from django.contrib.auth.models import UserManager as DjangoUserManager
from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return self.update(is_deleted=True, deleted_at=timezone.now())


class SoftDeleteUserManager(DjangoUserManager):
    """Default manager for User — excludes soft-deleted records."""

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class AllUsersManager(DjangoUserManager):
    """Unfiltered manager for User — includes soft-deleted records (admin use)."""

    pass


class SoftDeleteManager(models.Manager):
    """Default manager for non-User models — excludes soft-deleted records."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """Unfiltered manager — includes soft-deleted records (admin use)."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)