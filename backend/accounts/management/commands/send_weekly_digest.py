"""
Management command: send_weekly_digest

Sends a weekly summary email to every user who has opted in
(notification_preferences.weekly_digest = True).

Schedule this to run weekly via cron or Render's scheduled jobs:
    python manage.py send_weekly_digest

Usage:
    python manage.py send_weekly_digest
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Sum
from django.utils import timezone


class Command(BaseCommand):
    help = "Email weekly activity digests to opted-in users"

    def handle(self, *args, **options):
        from accounts.models import User
        from core.email import send_email
        from core.notifications import notify
        from reports.models import RecyclingActivity, Reward, WasteReport

        week_start = timezone.now().date() - timedelta(days=7)
        users = User.objects.filter(is_deleted=False)

        sent = 0
        for user in users:
            prefs = user.notification_preferences or {}
            if not prefs.get("weekly_digest", True):
                continue

            reports = WasteReport.objects.filter(
                user=user, created_at__date__gte=week_start
            ).count()
            recycling = RecyclingActivity.objects.filter(user=user, date__gte=week_start).count()
            points_earned = (
                Reward.objects.filter(user=user, date_earned__date__gte=week_start).aggregate(
                    t=Sum("points_earned")
                )["t"]
                or 0
            )

            notify(
                user,
                "weekly_digest",
                "Your weekly pTrack summary",
                f"This week: {reports} reports, {recycling} recycling activities, {points_earned} pts.",
                action_url="/rewards",
            )

            if not user.email.startswith("phone_"):
                send_email(
                    user.email,
                    "Your weekly pTrack summary",
                    "weekly_digest",
                    {
                        "user": user,
                        "reports": reports,
                        "recycling": recycling,
                        "points_earned": points_earned,
                    },
                )
                sent += 1

        self.stdout.write(self.style.SUCCESS(f"Sent {sent} weekly digest email(s)."))
