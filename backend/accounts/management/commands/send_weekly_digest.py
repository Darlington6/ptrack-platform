"""
Management command: send_weekly_digest

Sends a weekly summary email (and push notification if opted in) to every user
who has not disabled weekly_digest in their notification preferences.

Schedule: every Sunday at 18:00 CAT (UTC+2) via GitHub Actions cron:
    0 16 * * 0   python manage.py send_weekly_digest

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
        from core.models import Notification
        from core.notifications import notify
        from push.helpers import send_push
        from reports.models import RecyclingActivity, Reward, WasteReport

        week_start = timezone.now().date() - timedelta(days=7)
        users = User.objects.filter(is_deleted=False)

        sent = 0
        for user in users:
            prefs = user.notification_preferences or {}
            if not prefs.get("weekly_digest", True):
                continue

            if Notification.objects.filter(
                recipient=user, category="weekly_digest", created_at__date__gte=week_start
            ).exists():
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

            lang = getattr(user, 'preferred_language', 'en') or 'en'
            if lang == 'rw':
                title = "Incamake ya buri cyumweru ya pTrack"
                body = (
                    f"Iki cyumweru: raporo {reports}, ibikorwa {recycling} by'ugusubiza, "
                    f"amanota {points_earned}."
                )
            else:
                title = "Your weekly pTrack summary"
                body = (
                    f"This week: {reports} reports, {recycling} recycling activities, "
                    f"{points_earned} pts."
                )

            notify(user, "weekly_digest", title, body, action_url="/rewards")

            if not user.email.startswith("phone_"):
                delivered = send_email(
                    user.email,
                    title,
                    "weekly_digest",
                    {
                        "user": user,
                        "reports": reports,
                        "recycling": recycling,
                        "points_earned": points_earned,
                    },
                )
                if delivered:
                    sent += 1

            if prefs.get("push_enabled", False):
                send_push(user, title, body, url="/rewards")

        self.stdout.write(self.style.SUCCESS(f"Sent {sent} weekly digest email(s)."))
