from rest_framework import serializers

from .models import NudgeRule


class NudgeRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = NudgeRule
        fields = [
            "id",
            "code",
            "title_en",
            "title_rw",
            "body_en",
            "body_rw",
            "category",
            "priority",
        ]
        read_only_fields = fields


class LocalisedNudgeSerializer(serializers.ModelSerializer):
    """Returns title/body in the user's preferred language (en or rw)."""

    title = serializers.SerializerMethodField()
    body = serializers.SerializerMethodField()
    log_id = serializers.SerializerMethodField()

    class Meta:
        model = NudgeRule
        fields = ["id", "code", "title", "body", "category", "priority", "log_id"]
        read_only_fields = fields

    def get_title(self, obj):
        lang = self.context.get("lang", "en")
        return obj.title_rw if lang == "rw" else obj.title_en

    def get_body(self, obj):
        lang = self.context.get("lang", "en")
        return obj.body_rw if lang == "rw" else obj.body_en

    def get_log_id(self, obj):
        return getattr(obj, "_log_id", None)
