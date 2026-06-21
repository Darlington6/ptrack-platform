from django.contrib import admin

from .models import PushSubscription


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "is_active", "created_at", "last_used_at")
    list_filter = ("is_active",)
    raw_id_fields = ("user",)
    readonly_fields = ("created_at", "last_used_at")
