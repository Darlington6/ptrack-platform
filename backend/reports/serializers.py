from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import RecyclingActivity, Reward, WasteReport


class WasteReportSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source="user", read_only=True)

    class Meta:
        model = WasteReport
        fields = [
            "id",
            "user",
            "user_detail",
            "latitude",
            "longitude",
            "image",
            "description",
            "waste_type",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "user", "status", "created_at"]


class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = ["id", "points_earned", "reward_type", "date_earned"]
        read_only_fields = fields


class RecyclingActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = RecyclingActivity
        fields = ["id", "user", "activity_type", "points_awarded", "date"]
        read_only_fields = ["id", "user", "points_awarded", "date"]


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    points = serializers.IntegerField()
    sector = serializers.CharField()
