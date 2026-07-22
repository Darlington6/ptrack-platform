from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=200)
    target_type = models.CharField(max_length=100, blank=True)
    target_id = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["actor", "created_at"]),
            models.Index(fields=["target_type", "target_id", "created_at"]),
        ]

    def __str__(self):
        return f"{self.action} by {self.actor_id} at {self.created_at}"


class Notification(models.Model):
    CATEGORY_CHOICES = [
        ("system", "System"),
        ("badge_earned", "Badge Earned"),
        ("streak_warning", "Streak Warning"),
        ("weekly_digest", "Weekly Digest"),
        ("community", "Community"),
        ("admin", "Admin"),
        ("verification", "Verification"),
        ("rejection", "Rejection"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=200)
    body = models.TextField()
    title_rw = models.CharField(max_length=200, blank=True, default="")
    body_rw = models.TextField(blank=True, default="")
    action_url = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "created_at"]),
        ]

    def __str__(self):
        return f"[{self.category}] {self.title} → {self.recipient_id}"


class VerificationCode(models.Model):
    CHANNEL_CHOICES = [("email", "Email"), ("phone", "Phone")]
    PURPOSE_CHOICES = [
        ("register_verify", "Register Verify"),
        ("password_reset", "Password Reset"),
        ("phone_change", "Phone Change"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="verification_codes",
    )
    # Store hashed OTP only — never the plain-text code
    code_hash = models.CharField(max_length=256)
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "channel", "is_used", "expires_at"]),
        ]

    def __str__(self):
        return f"{self.purpose} via {self.channel} for user {self.user_id}"
