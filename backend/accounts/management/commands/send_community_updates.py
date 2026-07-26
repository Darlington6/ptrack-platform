"""
Management command: send_community_updates

Sends a sector-level activity update to every citizen whose sector has had
more than 5 new reports or recycling activities in the past week.

Schedule: every Tuesday and Friday at 17:00 CAT (UTC+2) via Render cron:
    0 15 * * 2,5   python manage.py send_community_updates

Usage:
    python manage.py send_community_updates
"""

import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

_log = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Send community activity updates to users in active sectors"

    def handle(self, *args, **options):
        from accounts.models import User
        from core.email import send_email
        from core.models import Notification
        from core.notifications import notify
        from push.helpers import send_push
        from reports.models import WasteReport

        since = timezone.now() - timedelta(days=7)
        sent = 0
        errors = 0

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
                try:
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
                    notify(
                        user,
                        "community",
                        title,
                        body,
                        action_url="/community",
                        title_rw="Umuryango wawe urakora!",
                        body_rw=(
                            f"Raporo {sector_reports} z'imyanda zatanzwe muri {sector} iki cyumweru. "
                            "Komeza akazi keza!"
                        ),
                    )

                    lang = getattr(user, "preferred_language", "en") or "en"
                    email_subject = (
                        "Umuryango wawe urakora!" if lang == "rw" else "Your community is active!"
                    )

                    if user.email and not user.email.startswith("phone_"):
                        send_email(
                            user.email,
                            email_subject,
                            "community_update",
                            {"user": user, "sector": sector, "sector_reports": sector_reports},
                        )

                    if prefs.get("push_enabled", False):
                        send_push(user, title, body, url="/community")

                    sent += 1

                except Exception:
                    errors += 1
                    _log.exception("send_community_updates: failed for user pk=%s", user.pk)

        self.stdout.write(
            self.style.SUCCESS(f"Community updates complete — sent={sent} errors={errors}")
        )


# ----
