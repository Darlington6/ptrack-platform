"""
Authentication views for pTrack.

Endpoints:
  POST /api/v1/auth/register/                — create a new citizen account
  POST /api/v1/auth/login/                   — obtain JWT access + refresh tokens
  GET  /api/v1/auth/me/                      — return the authenticated user's profile
  PATCH /api/v1/auth/me/                     — update profile fields
  POST  /api/v1/auth/me/password/            — change password
  POST  /api/v1/auth/me/avatar/              — upload profile picture
  DELETE /api/v1/auth/me/avatar/             — remove profile picture
  GET  /api/v1/auth/me/impact/               — environmental impact summary
  GET  /api/v1/auth/me/export/               — GDPR data export
  POST /api/v1/auth/me/delete/               — soft-delete account (GDPR)
  POST /api/v1/auth/verify/send/             — send OTP via email or phone
  POST /api/v1/auth/verify/confirm/          — confirm OTP and mark channel verified
  POST /api/v1/auth/password/reset/request/  — request password reset OTP
  POST /api/v1/auth/password/reset/confirm/  — confirm OTP and set new password
"""

import hashlib
import io
import random
import string

from django.contrib.auth import authenticate
from django.core.cache import cache
from django.core.files.base import ContentFile
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes, throttle_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User
from .otp import create_verification_code, verify_code
from .serializers import (
    AuthResponseSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    _is_phone,
)
from .throttles import AuthThrottle

_ME_CACHE_TTL = 60  # seconds

_UPDATABLE_PROFILE_FIELDS = [
    "bio",
    "preferred_language",
    "theme_preference",
    "weekly_goal",
    "show_on_leaderboard",
    "allow_public_reports",
    "notification_preferences",
    "has_completed_onboarding",
]


# ── Simple in-process OTP helpers ─────────────────────────────────────────────


def _make_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _otp_cache_key(user_pk: int, purpose: str) -> str:
    return f"otp:{user_pk}:{purpose}"


def _store_otp(user, purpose: str, ttl_minutes: int = 10) -> str:
    code = _make_otp()
    key = _otp_cache_key(user.pk, purpose)
    hashed = hashlib.sha256(code.encode()).hexdigest()
    cache.set(key, hashed, timeout=ttl_minutes * 60)
    return code


def _verify_otp(user, purpose: str, code: str) -> bool:
    key = _otp_cache_key(user.pk, purpose)
    stored = cache.get(key)
    if not stored:
        return False
    hashed = hashlib.sha256(code.encode()).hexdigest()
    if stored != hashed:
        return False
    cache.delete(key)  # single-use
    return True


# ── Registration & login ───────────────────────────────────────────────────────


@extend_schema(
    tags=["auth"],
    request=RegisterSerializer,
    responses={201: OpenApiResponse(description="JWT tokens + user profile")},
    summary="Register a new citizen user",
)
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def register(request):
    """Create a new citizen account, send email verification if address is real."""
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    user = serializer.save()

    if not user.email.startswith("phone_"):
        try:
            from core.email import send_email

            code = create_verification_code(user, "email", "register_verify")
            send_email(
                user.email,
                "Verify your pTrack email",
                "verify_email",
                {"user": user, "code": code},
            )
        except Exception:
            pass  # email failure must not block registration

    return Response(AuthResponseSerializer.build(user), status=status.HTTP_201_CREATED)


@extend_schema(
    tags=["auth"],
    request=LoginSerializer,
    responses={200: OpenApiResponse(description="JWT tokens + user profile")},
    summary="Login and obtain JWT tokens",
)
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def login(request):
    """
    Authenticate with email OR phone number + password.
    If the identifier is a phone number, look up the user's email first so
    Django's auth backend (which uses email as USERNAME_FIELD) can resolve it.
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    identifier = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    if _is_phone(identifier):
        user_obj = User.objects.filter(phone_number=identifier.strip()).first()
        if user_obj is None:
            return Response(
                {"detail": "No account found with that phone number."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        identifier = user_obj.email

    user = authenticate(request, username=identifier, password=password)
    if user is None:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return Response(AuthResponseSerializer.build(user))


# ── Current user ───────────────────────────────────────────────────────────────


@extend_schema(
    tags=["auth"],
    responses={200: UserSerializer},
    summary="Get or update the currently authenticated user",
    methods=["GET"],
)
@extend_schema(
    tags=["auth"],
    request=None,
    responses={200: UserSerializer},
    summary="Update profile fields (PATCH)",
    methods=["PATCH"],
)
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    """GET: cached profile. PATCH: update a safe subset of profile fields."""
    if request.method == "PATCH":
        data = {k: v for k, v in request.data.items() if k in _UPDATABLE_PROFILE_FIELDS}
        if not data:
            return Response(
                {"detail": "No updatable fields provided."}, status=status.HTTP_400_BAD_REQUEST
            )
        for field, value in data.items():
            setattr(request.user, field, value)
        request.user.save(update_fields=list(data.keys()))
        cache.delete(f"user:profile:{request.user.pk}")
        return Response(UserSerializer(request.user).data)

    # GET — cache for 60 s
    cache_key = f"user:profile:{request.user.pk}"
    cached = cache.get(cache_key)
    if cached is None:
        cached = UserSerializer(request.user).data
        cache.set(cache_key, cached, timeout=_ME_CACHE_TTL)
    return Response(cached)


@extend_schema(
    tags=["auth"],
    summary="Change the current user's password",
    responses={200: OpenApiResponse(description="Success message")},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def password_change(request):
    """Verify current password then set the new one."""
    current = request.data.get("current_password", "")
    new = request.data.get("new_password", "")

    if not current or not new:
        return Response(
            {"detail": "current_password and new_password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not request.user.check_password(current):
        return Response(
            {"detail": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST
        )
    if len(new) < 6:
        return Response(
            {"detail": "Password must be at least 6 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    request.user.set_password(new)
    request.user.save(update_fields=["password"])
    cache.delete(f"user:profile:{request.user.pk}")
    return Response({"detail": "Password changed successfully."})


# ── Avatar ─────────────────────────────────────────────────────────────────────


@extend_schema(
    tags=["auth"],
    summary="Upload a profile picture (max 2 MB, resized to 512×512 JPEG)",
    methods=["POST"],
    responses={200: OpenApiResponse(description="profile_picture URL")},
)
@extend_schema(
    tags=["auth"],
    summary="Remove profile picture",
    methods=["DELETE"],
    responses={204: None},
)
@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def avatar(request):
    if request.method == "DELETE":
        if request.user.profile_picture:
            request.user.profile_picture.delete(save=True)
        return Response(status=status.HTTP_204_NO_CONTENT)

    file = request.FILES.get("avatar")
    if not file:
        return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

    if file.size > 2 * 1024 * 1024:
        return Response(
            {"detail": "File size must be under 2 MB."}, status=status.HTTP_400_BAD_REQUEST
        )

    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        return Response(
            {"detail": "Only JPEG, PNG and WebP images are accepted."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        from PIL import Image

        img = Image.open(file).convert("RGB")
        img = img.resize((512, 512), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        filename = f"avatars/{request.user.pk}.jpg"
        request.user.profile_picture.save(filename, ContentFile(buf.getvalue()), save=True)
    except Exception:
        request.user.profile_picture.save(f"avatars/{request.user.pk}", file, save=True)

    cache.delete(f"user:profile:{request.user.pk}")
    return Response({"profile_picture": request.user.profile_picture.url})


# ── Impact ─────────────────────────────────────────────────────────────────────


@extend_schema(
    tags=["auth"],
    responses={200: OpenApiResponse(description="Environmental impact summary")},
    summary="Environmental impact summary for the current user",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def impact(request):
    """Return estimated plastic diverted, bottles equivalent, and CO₂ saved."""
    from .services import compute_impact

    return Response(compute_impact(request.user))


# ── GDPR ──────────────────────────────────────────────────────────────────────


@extend_schema(
    tags=["auth"],
    responses={200: OpenApiResponse(description="Full data export as JSON")},
    summary="Export all personal data (GDPR Article 20)",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_data(request):
    """Return a JSON snapshot of all personal data held for the authenticated user."""
    from reports.models import RecyclingActivity, Reward, WasteReport
    from reports.serializers import (
        RecyclingActivitySerializer,
        RewardSerializer,
        WasteReportSerializer,
    )

    return Response(
        {
            "profile": UserSerializer(request.user).data,
            "reports": WasteReportSerializer(
                WasteReport.objects.filter(user=request.user), many=True
            ).data,
            "rewards": RewardSerializer(Reward.objects.filter(user=request.user), many=True).data,
            "recycling": RecyclingActivitySerializer(
                RecyclingActivity.objects.filter(user=request.user), many=True
            ).data,
        }
    )


@extend_schema(
    tags=["auth"],
    responses={200: OpenApiResponse(description="Account deletion confirmation")},
    summary="Soft-delete account (GDPR Article 17) — requires password + 'DELETE MY ACCOUNT'",
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    Soft-delete the requesting user's account.
    Body must include ``password`` and ``confirmation = "DELETE MY ACCOUNT"``.
    """
    password = request.data.get("password", "")
    confirmation = request.data.get("confirmation", "")

    if not request.user.check_password(password):
        return Response({"detail": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST)

    if confirmation != "DELETE MY ACCOUNT":
        return Response(
            {"detail": "Send confirmation = 'DELETE MY ACCOUNT' to proceed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    request.user.delete()  # soft delete via overridden model method
    return Response({"detail": "Your account has been scheduled for deletion."})


# ── Email / phone verification ─────────────────────────────────────────────────


@extend_schema(
    tags=["auth"],
    responses={200: OpenApiResponse(description="OTP sent")},
    summary="Send a verification OTP to email or phone",
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([AuthThrottle])
def verify_send(request):
    """Send a 6-digit OTP via the requested channel (email | phone)."""
    channel = request.data.get("channel", "email")
    purpose = request.data.get("purpose", "register_verify")

    if channel not in ("email", "phone"):
        return Response({"detail": "channel must be 'email' or 'phone'."}, status=400)

    code = create_verification_code(request.user, channel, purpose)

    if channel == "email":
        from core.email import send_email

        send_email(
            request.user.email,
            "Your pTrack verification code",
            "verify_email",
            {"user": request.user, "code": code},
        )
    else:
        from core.sms import send_sms

        send_sms(request.user.phone_number or "", f"Your pTrack code: {code}")

    return Response({"detail": f"Verification code sent via {channel}."})


@extend_schema(
    tags=["auth"],
    responses={
        200: OpenApiResponse(description="Verified"),
        400: OpenApiResponse(description="Invalid or expired code"),
    },
    summary="Confirm OTP and mark the channel as verified",
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([AuthThrottle])
def verify_confirm(request):
    """Validate OTP and mark email_verified or phone_verified on the user."""
    channel = request.data.get("channel", "email")
    purpose = request.data.get("purpose", "register_verify")
    code = request.data.get("code", "")

    if not code:
        return Response({"detail": "code is required."}, status=status.HTTP_400_BAD_REQUEST)

    if not verify_code(request.user, channel, purpose, code):
        return Response({"detail": "Invalid or expired code."}, status=status.HTTP_400_BAD_REQUEST)

    if channel == "email":
        request.user.email_verified = True
        request.user.save(update_fields=["email_verified"])
    elif channel == "phone":
        request.user.phone_verified = True
        request.user.save(update_fields=["phone_verified"])

    cache.delete(f"user:profile:{request.user.pk}")
    return Response({"detail": "Verified successfully."})


# ── Password reset ─────────────────────────────────────────────────────────────


@extend_schema(
    tags=["auth"],
    responses={200: OpenApiResponse(description="Reset code sent (or silently skipped)")},
    summary="Request a password reset OTP",
)
@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):
    """POST /api/v1/auth/password/reset/request/
    Accepts: {"identifier": "email_or_phone"}
    Always returns 200 to avoid user enumeration.
    """
    identifier = request.data.get("identifier", "").strip()
    if not identifier:
        return Response({"detail": "Identifier is required."}, status=400)

    user = None
    if "@" in identifier:
        user = User.objects.filter(email__iexact=identifier).first()
    else:
        user = User.objects.filter(phone_number=identifier).first()

    if user:
        code = _store_otp(user, "password_reset")
        if "@" in identifier:
            try:
                from utils.email_service import send_verification_email

                send_verification_email(user.email, code)
            except Exception:
                pass
        else:
            import logging

            logging.getLogger(__name__).info(
                "Password reset OTP for %s: %s", identifier, code
            )

    return Response({"detail": "If an account exists, a reset code has been sent."})


@extend_schema(
    tags=["auth"],
    responses={
        200: OpenApiResponse(description="Password reset successfully"),
        400: OpenApiResponse(description="Invalid code or identifier"),
    },
    summary="Confirm OTP and set a new password",
)
@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """POST /api/v1/auth/password/reset/confirm/
    Accepts: {"identifier": "...", "code": "123456", "new_password": "..."}
    """
    identifier = request.data.get("identifier", "").strip()
    code = request.data.get("code", "").strip()
    new_password = request.data.get("new_password", "")

    if not all([identifier, code, new_password]):
        return Response(
            {"detail": "identifier, code, and new_password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = None
    if "@" in identifier:
        user = User.objects.filter(email__iexact=identifier).first()
    else:
        user = User.objects.filter(phone_number=identifier).first()

    if not user:
        return Response(
            {"detail": "Invalid code or identifier."}, status=status.HTTP_400_BAD_REQUEST
        )

    if not _verify_otp(user, "password_reset", code):
        return Response(
            {"detail": "Invalid or expired code."}, status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.save(update_fields=["password"])
    return Response({"detail": "Password reset successfully."})
