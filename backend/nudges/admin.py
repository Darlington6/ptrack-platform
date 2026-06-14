from django.contrib import admin

from .models import NudgeRule, UserNudgeLog


@admin.register(NudgeRule)
class NudgeRuleAdmin(admin.ModelAdmin):
    list_display = ["code", "category", "priority", "cooldown_hours", "is_active"]
    list_filter = ["category", "is_active"]
    search_fields = ["code", "title_en"]


@admin.register(UserNudgeLog)
class UserNudgeLogAdmin(admin.ModelAdmin):
    list_display = ["user", "rule", "shown_at", "acted_on", "dismissed_at"]
    list_filter = ["acted_on", "rule"]
    search_fields = ["user__email", "rule__code"]
