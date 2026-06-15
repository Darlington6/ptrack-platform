"""
Management command: send_streak_warnings

Finds users with streaks ≥ 2 who have not logged activity in the last 20 hours
and sends both an in-app notification and (if they opted in) an email reminder.

Usage:
    python manage.py send_streak_warnings
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Send streak-at-risk notifications to users who haven't acted today"

    def handle(self, *args, **options):
        from accounts.models import User
        from core.email import send_email
        from core.notifications import notify

        cutoff = (timezone.now() - timedelta(hours=20)).date()
        at_risk = User.objects.filter(
            current_streak__gte=2,
            last_activity_date__lt=cutoff,
            is_deleted=False,
        )

        count = 0
        for user in at_risk:
            notify(
                user,
                "streak_warning",
                "Your streak is at risk!",
                f"You have a {user.current_streak}-day streak. Log activity today to keep it going.",
                action_url="/dashboard",
            )

            prefs = user.notification_preferences or {}
            if prefs.get("streak_reminders", True) and not user.email.startswith("phone_"):
                send_email(
                    user.email,
                    "Your pTrack streak is at risk!",
                    "streak_warning",
                    {"user": user, "streak": user.current_streak},
                )

            count += 1

        self.stdout.write(self.style.SUCCESS(f"Sent streak warnings to {count} user(s)."))
