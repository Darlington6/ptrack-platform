from django.db import models


class RecyclingCentre(models.Model):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    sector = models.CharField(max_length=100)
    district = models.CharField(max_length=100, default="Gasabo")
    latitude = models.FloatField()
    longitude = models.FloatField()
    # e.g. ["PET", "HDPE", "cardboard"]
    accepted_materials = models.JSONField(default=list)
    # e.g. {"Mon": "08:00-17:00", "Sat": "09:00-13:00", "Sun": "closed"}
    operating_hours = models.JSONField(default=dict)
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.sector})"
