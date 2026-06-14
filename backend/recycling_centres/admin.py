from django.contrib import admin

from .models import RecyclingCentre


@admin.register(RecyclingCentre)
class RecyclingCentreAdmin(admin.ModelAdmin):
    list_display = ["name", "sector", "district", "is_active", "contact_phone"]
    list_filter = ["is_active", "district", "sector"]
    search_fields = ["name", "address", "sector"]