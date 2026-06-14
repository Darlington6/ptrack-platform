"""
Authentication views for pTrack.

Endpoints:
  POST /api/v1/auth/register/  — create a new citizen account
  POST /api/v1/auth/login/     — obtain JWT access + refresh tokens
  GET  /api/v1/auth/me/        — return the authenticated user's profile
  GET  /api/v1/auth/impact/    — environmental impact summary for current user
"""

from django.contrib.auth import authenticate
from django.core.cache import cache
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User
from .serializers import (
    AuthResponseSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    _is_phone,
)
from .throttles import AuthThrottle

_ME_CACHE_TTL = 60  # seconds


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
    """Create a new citizen account and return JWT tokens."""
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    user = serializer.save()
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


@extend_schema(
    tags=["auth"],
    responses={200: UserSerializer},
    summary="Get the currently authenticated user",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """Return the profile of the currently authenticated user. Cached for 60 s."""
    cache_key = f"user:profile:{request.user.pk}"
    data = cache.get(cache_key)
    if data is None:
        data = UserSerializer(request.user).data
        cache.set(cache_key, data, timeout=_ME_CACHE_TTL)
    return Response(data)


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
