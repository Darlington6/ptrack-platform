import math

from django.core.cache import cache
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from reports.permissions import IsAdminRole

from .models import RecyclingCentre
from .serializers import RecyclingCentreSerializer

_CENTRES_CACHE_KEY = "recycling_centres:all"
_CENTRES_CACHE_TTL = 3600  # 1 hour


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


# ── Public: list ───────────────────────────────────────────────────────────────


@extend_schema(
    tags=["recycling-centres"],
    parameters=[
        OpenApiParameter("material", str, description="Filter by accepted material (e.g. PET)"),
        OpenApiParameter("sector", str, description="Filter by district/sector name"),
        OpenApiParameter("lat", float, description="Near-filter: latitude"),
        OpenApiParameter("lon", float, description="Near-filter: longitude"),
        OpenApiParameter("radius_km", float, description="Near-filter: radius in km (default 5)"),
    ],
    responses={200: RecyclingCentreSerializer(many=True)},
    summary="List active recycling centres with optional filters",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def centres_list(request):
    """Return active recycling centres. Supports material, sector, and proximity filters."""
    material = request.query_params.get("material")
    sector = request.query_params.get("sector")
    lat_s = request.query_params.get("lat")
    lon_s = request.query_params.get("lon")
    radius_km_s = request.query_params.get("radius_km", "5")

    unfiltered = not any([material, sector, lat_s, lon_s])
    if unfiltered:
        data = cache.get(_CENTRES_CACHE_KEY)
        if data is not None:
            return Response(data)

    qs = RecyclingCentre.objects.filter(is_active=True)
    if sector:
        qs = qs.filter(sector__icontains=sector)

    centres = list(qs)

    if material:
        needle = material.lower()
        centres = [
            c for c in centres if needle in [m.lower() for m in (c.accepted_materials or [])]
        ]

    if lat_s and lon_s:
        try:
            lat = float(lat_s)
            lon = float(lon_s)
            radius = float(radius_km_s)
        except ValueError:
            return Response(
                {"detail": "lat, lon, and radius_km must be numeric."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        centres = [
            c
            for c in centres
            if c.latitude is not None
            and c.longitude is not None
            and _haversine_km(lat, lon, c.latitude, c.longitude) <= radius
        ]

    data = RecyclingCentreSerializer(centres, many=True).data
    if unfiltered:
        cache.set(_CENTRES_CACHE_KEY, data, timeout=_CENTRES_CACHE_TTL)
    return Response(data)


# ── Public: detail ─────────────────────────────────────────────────────────────


@extend_schema(
    tags=["recycling-centres"],
    responses={200: RecyclingCentreSerializer},
    summary="Retrieve a single recycling centre",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def centre_detail(request, pk):
    try:
        centre = RecyclingCentre.objects.get(pk=pk)
    except RecyclingCentre.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(RecyclingCentreSerializer(centre).data)


# ── Admin: list all (active + inactive) ───────────────────────────────────────


@extend_schema(
    tags=["admin-recycling-centres"],
    responses={200: RecyclingCentreSerializer(many=True)},
    summary="List all recycling centres including inactive (admin only)",
)
@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_centre_list(request):
    centres = RecyclingCentre.objects.all().order_by("name")
    return Response(RecyclingCentreSerializer(centres, many=True).data)


# ── Admin: CRUD ────────────────────────────────────────────────────────────────


@extend_schema(
    tags=["admin-recycling-centres"],
    request=RecyclingCentreSerializer,
    responses={201: RecyclingCentreSerializer},
    summary="Create a recycling centre (admin only)",
)
@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_centre_create(request):
    serializer = RecyclingCentreSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    centre = serializer.save()
    cache.delete(_CENTRES_CACHE_KEY)
    return Response(RecyclingCentreSerializer(centre).data, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=["admin-recycling-centres"],
    request=RecyclingCentreSerializer,
    responses={200: RecyclingCentreSerializer},
    summary="Update a recycling centre (admin only)",
)
@api_view(["PATCH"])
@permission_classes([IsAdminRole])
def admin_centre_update(request, pk):
    try:
        centre = RecyclingCentre.objects.get(pk=pk)
    except RecyclingCentre.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    serializer = RecyclingCentreSerializer(centre, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    cache.delete(_CENTRES_CACHE_KEY)
    return Response(serializer.data)


@extend_schema(
    tags=["admin-recycling-centres"],
    responses={204: None},
    summary="Delete a recycling centre (admin only)",
)
@api_view(["DELETE"])
@permission_classes([IsAdminRole])
def admin_centre_delete(request, pk):
    try:
        centre = RecyclingCentre.objects.get(pk=pk)
    except RecyclingCentre.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    centre.delete()
    cache.delete(_CENTRES_CACHE_KEY)
    return Response(status=status.HTTP_204_NO_CONTENT)
