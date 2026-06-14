from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .engine import get_active_nudges_for
from .serializers import NudgeRuleSerializer


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
