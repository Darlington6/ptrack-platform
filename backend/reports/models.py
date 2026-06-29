from django.conf import settings
from django.db import models
from django.utils import timezone

from accounts.managers import AllObjectsManager, SoftDeleteManager


class PointConfiguration(models.Model):
    event = models.CharField(max_length=60, unique=True)
    points = models.IntegerField()
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["event"]

    def __str__(self):
        return f"{self.event}: {self.points} pts"


class BadgeDefinition(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=200, blank=True)
    required_points = models.IntegerField(default=0)
    badge_type = models.CharField(max_length=30, default="points")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["required_points"]

    def __str__(self):
        return self.name


class WasteReport(models.Model):
    WASTE_TYPE_CHOICES = [
        ("bottles", "Plastic Bottles"),
        ("bags", "Plastic Bags"),
        ("mixed", "Mixed Plastic"),
        ("other", "Other"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("verified", "Verified"),
        ("resolved", "Resolved"),
        ("rejected", "Rejected"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports"
    )
    latitude = models.FloatField()
    longitude = models.FloatField()
    image = models.ImageField(upload_to="ptrack/reports/", null=True, blank=True)
    thumbnail = models.ImageField(upload_to="ptrack/thumbnails/", null=True, blank=True)
    description = models.TextField(blank=True)
    waste_type = models.CharField(max_length=20, choices=WASTE_TYPE_CHOICES, default="bottles")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    # ── Soft delete ───────────────────────────────────────────────────────────
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ["-created_at"]

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])

    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)

    def __str__(self):
        return f"Report #{self.pk} — {self.waste_type} by {self.user.email}"


class Reward(models.Model):
    REWARD_TYPE_CHOICES = [
        ("report_submitted", "Report Submitted"),
        ("recycling_logged", "Recycling Logged"),
        ("verification_bonus", "Verification Bonus"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rewards"
    )
    points_earned = models.IntegerField()
    reward_type = models.CharField(max_length=30, choices=REWARD_TYPE_CHOICES)
    date_earned = models.DateTimeField(auto_now_add=True)

    # ── Soft delete ───────────────────────────────────────────────────────────
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ["-date_earned"]

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])

    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)

    def __str__(self):
        return f"+{self.points_earned} pts for {self.user.email} ({self.reward_type})"


class RecyclingActivity(models.Model):
    ACTIVITY_TYPE_CHOICES = [
        ("drop_off", "Drop Off"),
        ("pickup", "Pickup"),
        ("exchange", "Exchange"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recycling_activities"
    )
    activity_type = models.CharField(
        max_length=20, choices=ACTIVITY_TYPE_CHOICES, default="drop_off"
    )
    points_awarded = models.IntegerField(default=15)
    date = models.DateTimeField(auto_now_add=True)

    # ── Soft delete ───────────────────────────────────────────────────────────
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        ordering = ["-date"]

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])

    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)

    def __str__(self):
        return f"Recycling by {self.user.email} — {self.activity_type}"
