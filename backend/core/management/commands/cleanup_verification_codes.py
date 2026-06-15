"""
Management command: cleanup_verification_codes

Deletes all expired or already-used VerificationCode rows.

Schedule this daily via cron or Render's scheduled jobs:
    python manage.py cleanup_verification_codes

Usage:
    python manage.py cleanup_verification_codes
"""

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Delete expired or used verification codes"

    def handle(self, *args, **options):
        from core.models import VerificationCode

        expired_count, _ = VerificationCode.objects.filter(expires_at__lt=timezone.now()).delete()
        used_count, _ = VerificationCode.objects.filter(is_used=True).delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {expired_count} expired and {used_count} used verification codes."
            )
        )
