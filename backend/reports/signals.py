from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import RecyclingActivity, WasteReport


@receiver(post_save, sender=WasteReport)
def on_waste_report_saved(sender, instance, created, **kwargs):
    if created:
        from accounts.services import update_streak

        update_streak(instance.user)


@receiver(post_save, sender=RecyclingActivity)
def on_recycling_activity_saved(sender, instance, created, **kwargs):
    if created:
        from accounts.services import update_streak

        update_streak(instance.user)