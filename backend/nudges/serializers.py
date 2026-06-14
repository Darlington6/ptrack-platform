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
