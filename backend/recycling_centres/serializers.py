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
            "is_active",
        ]
        read_only_fields = ["id"]
