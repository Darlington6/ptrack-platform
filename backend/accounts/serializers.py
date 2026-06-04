import re
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


def _is_phone(value: str) -> bool:
    """Return True if the value looks like a phone number rather than an email."""
    return bool(re.match(r'^\+?[\d\s\-().]{7,}$', value.strip()))


def _clean_phone(phone: str) -> str:
    """Strip non-digit characters — used to build a placeholder email."""
    return re.sub(r'\D', '', phone)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "full_name", "phone_number",
            "sector", "points", "role", "created_at",
        ]
        read_only_fields = ["id", "points", "created_at"]


class RegisterSerializer(serializers.ModelSerializer):
    # 'email' accepts either an email address or a phone number — we normalise
    # phone-only registrations by auto-generating a placeholder email so that
    # Django's auth system (which uses email as USERNAME_FIELD) still works.
    email = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username", "email", "full_name", "phone_number",
            "sector", "password", "confirm_password",
        ]

    def validate(self, data):
        if data["password"] != data.pop("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        identifier = data.get("email", "")

        if _is_phone(identifier):
            # Phone registration — store the phone number and generate a
            # placeholder email so Django's auth backend is satisfied.
            phone = identifier.strip()
            if User.objects.filter(phone_number=phone).exists():
                raise serializers.ValidationError(
                    {"email": "An account with this phone number already exists."}
                )
            data["phone_number"] = phone
            data["email"] = f"phone_{_clean_phone(phone)}@ptrack.local"
        else:
            # Standard email registration — validate email format
            try:
                serializers.EmailField().run_validation(identifier)
            except serializers.ValidationError:
                raise serializers.ValidationError(
                    {"email": "Enter a valid email address or phone number."}
                )

        return data

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data.get("username", validated_data["email"]),
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data.get("full_name", ""),
            phone_number=validated_data.get("phone_number", ""),
            sector=validated_data.get("sector", "Kimironko"),
        )


class LoginSerializer(serializers.Serializer):
    # CharField (not EmailField) so phone numbers pass validation too
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)


class AuthResponseSerializer(serializers.Serializer):
    """Utility — builds the token + user payload returned on login/register."""

    @staticmethod
    def get_tokens_for_user(user):
        refresh = RefreshToken.for_user(user)
        return {"refresh": str(refresh), "access": str(refresh.access_token)}

    @staticmethod
    def build(user):
        tokens = AuthResponseSerializer.get_tokens_for_user(user)
        return {**tokens, "user": UserSerializer(user).data}