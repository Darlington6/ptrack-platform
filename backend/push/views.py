from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import PushSubscription


@extend_schema(
    tags=["push"],
    request={
        "application/json": {
            "type": "object",
            "required": ["endpoint", "keys"],
            "properties": {
                "endpoint": {"type": "string"},
                "keys": {
                    "type": "object",
                    "properties": {
                        "p256dh": {"type": "string"},
                        "auth": {"type": "string"},
                    },
                },
            },
        }
    },
    responses={201: OpenApiResponse(description="Subscribed")},
    summary="Register a web push subscription",
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def subscribe(request):
    endpoint = request.data.get("endpoint", "")
    keys = request.data.get("keys", {})
    p256dh = keys.get("p256dh", "")
    auth_key = keys.get("auth", "")
    user_agent = request.META.get("HTTP_USER_AGENT", "")[:512]

    if not endpoint or not p256dh or not auth_key:
        return Response({"detail": "endpoint, keys.p256dh and keys.auth are required."}, status=400)

    sub, created = PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={
            "user": request.user,
            "p256dh": p256dh,
            "auth": auth_key,
            "user_agent": user_agent,
            "is_active": True,
            "last_used_at": timezone.now(),
        },
    )
    return Response(
        {"detail": "Subscribed.", "id": sub.pk},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@extend_schema(
    tags=["push"],
    request={
        "application/json": {
            "type": "object",
            "required": ["endpoint"],
            "properties": {"endpoint": {"type": "string"}},
        }
    },
    responses={200: OpenApiResponse(description="Unsubscribed")},
    summary="Remove a web push subscription",
)
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unsubscribe(request):
    endpoint = request.data.get("endpoint", "")
    PushSubscription.objects.filter(user=request.user, endpoint=endpoint).update(is_active=False)
    return Response({"detail": "Unsubscribed."})


@extend_schema(
    tags=["push"],
    responses={200: OpenApiResponse(description="VAPID public key")},
    summary="Return the VAPID public key for client-side subscription",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vapid_public_key(request):
    from django.conf import settings

    key = getattr(settings, "VAPID_PUBLIC_KEY", "")
    return Response({"vapid_public_key": key})
