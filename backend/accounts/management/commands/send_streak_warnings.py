"""
Management command: send_streak_warnings

Finds users with streaks ≥ 2 who have not logged activity in the last 20 hours
and sends an in-app notification, an email reminder (if opted in), and a web
push notification (if push_enabled).

Schedule: daily at 19:00 CAT (UTC+2) via Render cron:
    0 17 * * *   python manage.py send_streak_warnings

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
        from core.models import Notification
        from core.notifications import notify
        from push.helpers import send_push

        today = timezone.now().date()
        cutoff = (timezone.now() - timedelta(hours=20)).date()
        at_risk = User.objects.filter(
            current_streak__gte=2,
            last_activity_date__lt=cutoff,
            is_deleted=False,
        )

        count = 0
        for user in at_risk:
            if Notification.objects.filter(
                recipient=user, category="streak_warning", created_at__date=today
            ).exists():
                continue

            title = "Your streak is at risk!"
            body = (
                f"You have a {user.current_streak}-day streak. "
                "Log activity today to keep it going."
            )

            notify(user, "streak_warning", title, body, action_url="/dashboard")

            prefs = user.notification_preferences or {}
            if prefs.get("streak_reminders", True) and not user.email.startswith("phone_"):
                send_email(
                    user.email,
                    "Your pTrack streak is at risk!",
                    "streak_warning",
                    {"user": user, "streak": user.current_streak},
                )

            if prefs.get("push_enabled", False):
                send_push(user, title, body, url="/dashboard")

            count += 1

        self.stdout.write(self.style.SUCCESS(f"Sent streak warnings to {count} user(s)."))
