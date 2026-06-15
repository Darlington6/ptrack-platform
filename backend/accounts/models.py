from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from .managers import AllUsersManager, SoftDeleteUserManager


def _default_notification_preferences():
    return {
        "streak_reminders": True,
        "weekly_digest": True,
        "community_updates": True,
        "badge_earned": True,
    }


class User(AbstractUser):
    ROLE_CHOICES = [("citizen", "Citizen"), ("admin", "Admin")]
    LANGUAGE_CHOICES = [("en", "English"), ("rw", "Kinyarwanda")]
    THEME_CHOICES = [("system", "System"), ("light", "Light"), ("dark", "Dark")]

    # ── Core identity ─────────────────────────────────────────────────────────
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    sector = models.CharField(max_length=100, default="Kimironko")
    points = models.IntegerField(default=0)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="citizen")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Profile ───────────────────────────────────────────────────────────────
    profile_picture = models.ImageField(upload_to="avatars/", null=True, blank=True)
    bio = models.CharField(max_length=200, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    preferred_language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="en")
    theme_preference = models.CharField(max_length=10, choices=THEME_CHOICES, default="system")

    # ── Engagement ────────────────────────────────────────────────────────────
    has_completed_onboarding = models.BooleanField(default=False)
    weekly_goal = models.IntegerField(default=5)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)

    # ── Verification ──────────────────────────────────────────────────────────
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)

    # ── Privacy ───────────────────────────────────────────────────────────────
    show_on_leaderboard = models.BooleanField(default=True)
    allow_public_reports = models.BooleanField(default=True)

    # ── Preferences ───────────────────────────────────────────────────────────
    notification_preferences = models.JSONField(default=_default_notification_preferences)

    # ── Soft delete ───────────────────────────────────────────────────────────
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = SoftDeleteUserManager()
    all_objects = AllUsersManager()

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])

    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)

    def __str__(self):
        return self.email