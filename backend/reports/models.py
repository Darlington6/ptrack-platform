from django.db import models
from django.conf import settings


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
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports")
    latitude = models.FloatField()
    longitude = models.FloatField()
    image = models.ImageField(upload_to="reports/", null=True, blank=True)
    description = models.TextField(blank=True)
    waste_type = models.CharField(max_length=20, choices=WASTE_TYPE_CHOICES, default="bottles")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report #{self.pk} — {self.waste_type} by {self.user.email}"


class Reward(models.Model):
    REWARD_TYPE_CHOICES = [
        ("report_submitted", "Report Submitted"),
        ("recycling_logged", "Recycling Logged"),
        ("verification_bonus", "Verification Bonus"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rewards")
    points_earned = models.IntegerField()
    reward_type = models.CharField(max_length=30, choices=REWARD_TYPE_CHOICES)
    date_earned = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_earned"]

    def __str__(self):
        return f"+{self.points_earned} pts for {self.user.email} ({self.reward_type})"


class RecyclingActivity(models.Model):
    ACTIVITY_TYPE_CHOICES = [
        ("drop_off", "Drop Off"),
        ("pickup", "Pickup"),
        ("exchange", "Exchange"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recycling_activities")
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPE_CHOICES, default="drop_off")
    points_awarded = models.IntegerField(default=15)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"Recycling by {self.user.email} — {self.activity_type}"
