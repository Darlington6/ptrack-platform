from rest_framework import serializers

from .models import RecyclingCentre


class RecyclingCentreSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecyclingCentre
        fields = [
            "id",
            "name",
            "address",
            "sector",
            "district",
            "latitude",
            "longitude",
            "accepted_materials",
            "operating_hours",
            "contact_phone",
            "contact_email",
            "open_time",
            "close_time",
            "is_active",
        ]
        read_only_fields = ["id"]
