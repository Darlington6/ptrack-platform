"""
Authentication views for pTrack.

Endpoints:
  POST /api/auth/register/  — create a new citizen account
  POST /api/auth/login/     — obtain JWT access + refresh tokens
  GET  /api/auth/me/        — return the authenticated user's profile
"""

from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    AuthResponseSerializer,
    _is_phone,
)


@extend_schema(
    tags=["auth"],
    request=RegisterSerializer,
    responses={201: OpenApiResponse(description="JWT tokens + user profile")},
    summary="Register a new citizen user",
)
@api_view(["POST"])
@permission_classes([AllowAny])
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

    # Resolve phone → email before calling Django's authenticate()
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
    """Return the profile of the currently authenticated user."""
    return Response(UserSerializer(request.user).data)