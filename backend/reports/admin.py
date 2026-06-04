from django.contrib import admin
from .models import WasteReport, Reward, RecyclingActivity


@admin.register(WasteReport)
class WasteReportAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "waste_type", "status", "latitude", "longitude", "created_at"]
    list_filter = ["status", "waste_type"]
    search_fields = ["user__email", "description"]
    ordering = ["-created_at"]
    actions = ["mark_verified"]

    @admin.action(description="Mark selected reports as verified")
    def mark_verified(self, request, queryset):
        queryset.update(status="verified")


@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "points_earned", "reward_type", "date_earned"]
    list_filter = ["reward_type"]
    search_fields = ["user__email"]
    ordering = ["-date_earned"]


@admin.register(RecyclingActivity)
class RecyclingActivityAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "activity_type", "points_awarded", "date"]
    list_filter = ["activity_type"]
    search_fields = ["user__email"]
    ordering = ["-date"]
