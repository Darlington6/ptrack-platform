from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import RecyclingCentre
from .serializers import RecyclingCentreSerializer

_CENTRES_CACHE_KEY = "recycling_centres:all"
_CENTRES_CACHE_TTL = 3600  # 1 hour


@extend_schema(
    tags=["recycling-centres"],
    responses={200: RecyclingCentreSerializer(many=True)},
    summary="List active recycling centres in Kigali",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def centres_list(request):
    """Return all active recycling drop-off centres. Cached for 1 hour."""
    data = cache.get(_CENTRES_CACHE_KEY)
    if data is None:
        qs = RecyclingCentre.objects.filter(is_active=True)
        data = RecyclingCentreSerializer(qs, many=True).data
        cache.set(_CENTRES_CACHE_KEY, data, timeout=_CENTRES_CACHE_TTL)
    return Response(data)
