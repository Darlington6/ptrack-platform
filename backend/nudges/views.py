from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .engine import get_active_nudges_for
from .models import NudgeRule, UserNudgeLog
from .serializers import LocalisedNudgeSerializer, NudgeRuleSerializer


@extend_schema(
    tags=["nudges"],
    responses={200: NudgeRuleSerializer(many=True)},
    summary="Get personalised nudges for the current user (max 3)",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_nudges(request):
    """Return up to 3 active nudge rules that apply to the requesting user."""
    nudges = get_active_nudges_for(request.user, limit=3)
    return Response(NudgeRuleSerializer(nudges, many=True).data)


@extend_schema(
    tags=["nudges"],
    responses={200: LocalisedNudgeSerializer(many=True)},
    summary="Active nudges with localised title/body and log IDs",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def active_nudges(request):
    """
    Return up to 3 active nudges localised to the user's preferred language.
    Creates UserNudgeLog entries so dismiss/acted_on can be recorded.
    """
    nudges = get_active_nudges_for(request.user, limit=3)

    for rule in nudges:
        log = UserNudgeLog.objects.create(user=request.user, rule=rule)
        rule._log_id = log.pk

    lang = getattr(request.user, "preferred_language", "en") or "en"
    return Response(LocalisedNudgeSerializer(nudges, many=True, context={"lang": lang}).data)


@extend_schema(
    tags=["nudges"],
    responses={200: OpenApiResponse(description="Dismissed")},
    summary="Dismiss a nudge",
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def nudge_dismiss(request, pk):
    """Mark the most recent UserNudgeLog for this rule as dismissed."""
    try:
        rule = NudgeRule.objects.get(pk=pk)
    except NudgeRule.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    log = UserNudgeLog.objects.filter(user=request.user, rule=rule).order_by("-shown_at").first()
    if log and not log.dismissed_at:
        log.dismissed_at = timezone.now()
        log.save(update_fields=["dismissed_at"])

    return Response({"detail": "Dismissed."})


@extend_schema(
    tags=["nudges"],
    responses={200: OpenApiResponse(description="Recorded")},
    summary="Mark a nudge as acted on",
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def nudge_acted(request, pk):
    """Record that the user took the action suggested by this nudge."""
    try:
        rule = NudgeRule.objects.get(pk=pk)
    except NudgeRule.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    log = UserNudgeLog.objects.filter(user=request.user, rule=rule).order_by("-shown_at").first()
    if log:
        log.acted_on = True
        log.save(update_fields=["acted_on"])

    return Response({"detail": "Recorded."})
