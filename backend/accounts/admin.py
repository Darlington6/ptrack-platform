from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "full_name", "role", "points", "sector", "created_at"]
    list_filter = ["role", "sector"]
    search_fields = ["email", "full_name", "username"]
    ordering = ["-created_at"]
    fieldsets = BaseUserAdmin.fieldsets + (  # type: ignore[operator]
        ("pTrack Fields", {"fields": ("full_name", "phone_number", "sector", "points", "role")}),
    )
