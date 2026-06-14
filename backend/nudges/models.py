from django.conf import settings
from django.db import models


class NudgeRule(models.Model):
    code = models.CharField(max_length=50, unique=True)
    title_en = models.CharField(max_length=200)
    title_rw = models.CharField(max_length=200)
    body_en = models.TextField()
    body_rw = models.TextField()
    category = models.CharField(max_length=50)
    priority = models.IntegerField(default=10)
    # Declarative rule payload — e.g. {"type": "STREAK_WARNING", "threshold": 2}
    trigger_condition = models.JSONField(default=dict)
    cooldown_hours = models.IntegerField(default=24)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["priority", "code"]

    def __str__(self):
        return f"[{self.code}] {self.title_en}"


class UserNudgeLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="nudge_logs",
    )
    rule = models.ForeignKey(
        NudgeRule,
        on_delete=models.CASCADE,
        related_name="log_entries",
    )
    shown_at = models.DateTimeField(auto_now_add=True)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    acted_on = models.BooleanField(default=False)

    class Meta:
        ordering = ["-shown_at"]
        indexes = [
            models.Index(fields=["user", "rule", "shown_at"]),
        ]

    def __str__(self):
        return f"{self.user_id} saw {self.rule.code} at {self.shown_at}"
