from django.contrib import admin
from django.utils.html import format_html

from .models import RecyclingActivity, Reward, WasteReport

_PRIORITY_COLOURS = {
    1: ("#b91c1c", "P1"),  # red
    2: ("#c2410c", "P2"),  # orange
    3: ("#b45309", "P3"),  # amber
    4: ("#15803d", "P4"),  # green
    5: ("#6b7280", "P5"),  # grey
}


@admin.register(WasteReport)
class WasteReportAdmin(admin.ModelAdmin):
    list_display = [
        "id", "user", "waste_type", "ai_type_display", "priority_badge",
        "status", "flagged_display", "created_at",
    ]
    list_filter = ["status", "waste_type", "is_flagged", "ai_priority"]
    search_fields = ["user__email", "description", "sector"]
    ordering = ["ai_priority", "-created_at"]
    readonly_fields = [
        "ai_waste_type", "ai_confidence", "ai_priority", "ai_priority_reason",
        "ai_is_valid", "image_hash", "is_flagged", "flag_reasons",
    ]
    actions = ["mark_verified"]

    @admin.display(description="AI type")
    def ai_type_display(self, obj):
        if obj.ai_waste_type:
            pct = f" ({int((obj.ai_confidence or 0) * 100)}%)" if obj.ai_confidence else ""
            return f"{obj.ai_waste_type}{pct}"
        return "—"

    @admin.display(description="Priority")
    def priority_badge(self, obj):
        if obj.ai_priority is None:
            return "—"
        colour, label = _PRIORITY_COLOURS.get(obj.ai_priority, ("#6b7280", f"P{obj.ai_priority}"))
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;'
            'font-weight:bold;font-size:11px">{}</span>',
            colour,
            label,
        )

    @admin.display(description="Flagged", boolean=False)
    def flagged_display(self, obj):
        if not obj.is_flagged:
            return "—"
        return format_html(
            '<span style="color:#b91c1c;font-weight:bold">⚠ {}</span>',
            ", ".join(obj.flag_reasons or []),
        )

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


# ----
