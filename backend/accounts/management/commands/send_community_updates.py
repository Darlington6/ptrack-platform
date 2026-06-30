"""
Management command: send_community_updates

Sends a sector-level activity update to every citizen whose sector has had
more than 5 new reports or recycling activities in the past week.

Schedule: every Tuesday and Friday at 17:00 CAT (UTC+2) via Render cron:
    0 15 * * 2,5   python manage.py send_community_updates

Usage:
    python manage.py send_community_updates
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Send community activity updates to users in active sectors"

    def handle(self, *args, **options):
        from accounts.models import User
        from core.models import Notification
        from core.notifications import notify
        from push.helpers import send_push
        from reports.models import WasteReport

        since = timezone.now() - timedelta(days=7)
        sent = 0

        # Get all active sectors that have had meaningful activity
        active_sectors = (
            WasteReport.objects.filter(created_at__gte=since)
            .values_list("user__sector", flat=True)
            .distinct()
        )

        for sector in active_sectors:
            sector_reports = WasteReport.objects.filter(
                user__sector=sector, created_at__gte=since
            ).count()

            if sector_reports < 5:
                continue

            users = User.objects.filter(sector=sector, is_deleted=False)
            for user in users:
                prefs = user.notification_preferences or {}
                if not prefs.get("community_updates", True):
                    continue

                if Notification.objects.filter(
                    recipient=user, category="community", created_at__gte=since
                ).exists():
                    continue

                title = "Your community is active!"
                body = (
                    f"{sector_reports} waste reports were submitted in {sector} this week. "
                    "Keep up the great work!"
                )

                notify(user, "community", title, body, action_url="/community")

                if prefs.get("push_enabled", False):
                    send_push(user, title, body, url="/community")

                sent += 1

        self.stdout.write(self.style.SUCCESS(f"Sent community updates to {sent} user(s)."))
