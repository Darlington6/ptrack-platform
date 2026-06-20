from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import RecyclingActivity, WasteReport


def _generate_thumbnail(instance: WasteReport) -> None:
    """Create a 256×256 WebP thumbnail. Skipped when Cloudinary handles images."""
    if getattr(settings, "USE_CLOUDINARY", False):
        return
    try:
        from PIL import Image

        img = Image.open(instance.image)
        img.thumbnail((256, 256))
        buf = BytesIO()
        img.save(buf, format="WEBP", quality=80)
        name = f"thumb_{instance.pk}.webp"
        instance.thumbnail.save(name, ContentFile(buf.getvalue()), save=False)
        WasteReport.objects.filter(pk=instance.pk).update(thumbnail=instance.thumbnail.name)
    except Exception:
        pass


@receiver(post_save, sender=WasteReport)
def on_waste_report_saved(sender, instance, created, **kwargs):
    if created:
        from accounts.services import update_streak

        update_streak(instance.user)
        if instance.image:
            _generate_thumbnail(instance)


@receiver(post_save, sender=RecyclingActivity)
def on_recycling_activity_saved(sender, instance, created, **kwargs):
    if created:
        from accounts.services import update_streak

        update_streak(instance.user)
