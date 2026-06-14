from django.contrib import admin

from .models import AuditLog, Notification, VerificationCode


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "actor", "target_type", "target_id", "ip_address", "created_at"]
    list_filter = ["target_type"]
    search_fields = ["action", "actor__email", "ip_address"]
    readonly_fields = [f.name for f in AuditLog._meta.get_fields()]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["title", "recipient", "category", "is_read", "created_at"]
    list_filter = ["category", "is_read"]
    search_fields = ["title", "recipient__email"]


@admin.register(VerificationCode)
class VerificationCodeAdmin(admin.ModelAdmin):
    list_display = ["user", "channel", "purpose", "is_used", "expires_at", "created_at"]
    list_filter = ["channel", "purpose", "is_used"]