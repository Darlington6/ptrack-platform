"""
Core API views for pTrack waste reports, recycling activities,
leaderboard and rewards.

Point economy:
  Report submitted   → +10 pts (citizen)
  Recycling logged   → +15 pts (citizen)
  Report verified    → +5  pts (citizen who filed the report)
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .models import WasteReport, Reward, RecyclingActivity
from .serializers import (
    WasteReportSerializer,
    RewardSerializer,
    RecyclingActivitySerializer,
    LeaderboardEntrySerializer,
)
from .permissions import IsAdminRole

User = get_user_model()


# ── Reports ────────────────────────────────────────────────────────────────────

@extend_schema(
    tags=["reports"],
    parameters=[
        OpenApiParameter("status", str, description="Filter by status: pending | verified | resolved"),
        OpenApiParameter("user", str, description="Pass 'me' to return only the current user's reports"),
    ],
    responses={200: WasteReportSerializer(many=True)},
    summary="List waste reports",
    methods=["GET"],
)
@extend_schema(
    tags=["reports"],
    request=WasteReportSerializer,
    responses={201: OpenApiResponse(description="Created report + new points balance")},
    summary="Submit a new waste report (+10 pts)",
    methods=["POST"],
)
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def reports_list_create(request):
    """
    GET  — list all reports; supports ?status= and ?user=me filters.
    POST — submit a new report; automatically awards 10 points to the user.
    """
    if request.method == "GET":
        qs = WasteReport.objects.select_related("user").all()
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if request.query_params.get("user") == "me":
            qs = qs.filter(user=request.user)
        return Response(WasteReportSerializer(qs, many=True).data)

    # POST — create report and award 10 points
    serializer = WasteReportSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    report = serializer.save(user=request.user)

    Reward.objects.create(user=request.user, points_earned=10, reward_type="report_submitted")
    request.user.points += 10
    request.user.save(update_fields=["points"])

    return Response(
        {**WasteReportSerializer(report).data, "new_points_balance": request.user.points},
        status=status.HTTP_201_CREATED,
    )


@extend_schema(tags=["reports"], responses={200: WasteReportSerializer}, summary="Retrieve a single report")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_detail(request, pk):
    """Return a single waste report by ID."""
    try:
        report = WasteReport.objects.select_related("user").get(pk=pk)
    except WasteReport.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(WasteReportSerializer(report).data)


@extend_schema(
    tags=["reports"],
    request=None,
    responses={200: WasteReportSerializer},
    summary="Verify a report (admin only, +5 pts to citizen)",
)
@api_view(["PATCH"])
@permission_classes([IsAdminRole])
def report_verify(request, pk):
    """
    Mark a report as verified and award 5 bonus points to the citizen who filed it.
    Requires admin role.
    """
    try:
        report = WasteReport.objects.select_related("user").get(pk=pk)
    except WasteReport.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    report.status = "verified"
    report.save(update_fields=["status"])

    Reward.objects.create(user=report.user, points_earned=5, reward_type="verification_bonus")
    report.user.points += 5
    report.user.save(update_fields=["points"])

    return Response(WasteReportSerializer(report).data)


# ── Recycling ──────────────────────────────────────────────────────────────────

@extend_schema(
    tags=["recycling"],
    responses={200: RecyclingActivitySerializer(many=True)},
    summary="List current user's recycling activities",
    methods=["GET"],
)
@extend_schema(
    tags=["recycling"],
    request=RecyclingActivitySerializer,
    responses={201: OpenApiResponse(description="Created activity + new points balance")},
    summary="Log a recycling activity (+15 pts)",
    methods=["POST"],
)
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def recycling_list_create(request):
    """
    GET  — return all recycling activities for the current user.
    POST — log a new activity; automatically awards 15 points.
    """
    if request.method == "GET":
        qs = RecyclingActivity.objects.filter(user=request.user)
        return Response(RecyclingActivitySerializer(qs, many=True).data)

    serializer = RecyclingActivitySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    activity = serializer.save(user=request.user, points_awarded=15)

    Reward.objects.create(user=request.user, points_earned=15, reward_type="recycling_logged")
    request.user.points += 15
    request.user.save(update_fields=["points"])

    return Response(
        {**RecyclingActivitySerializer(activity).data, "new_points_balance": request.user.points},
        status=status.HTTP_201_CREATED,
    )


# ── Leaderboard ────────────────────────────────────────────────────────────────

@extend_schema(
    tags=["leaderboard"],
    responses={200: LeaderboardEntrySerializer(many=True)},
    summary="Top 20 users ranked by points",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    """Return the top 20 users ordered by total points (descending)."""
    top_users = User.objects.order_by("-points")[:20]
    data = [
        {
            "rank": idx + 1,
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name or u.username,
            "points": u.points,
            "sector": u.sector,
        }
        for idx, u in enumerate(top_users)
    ]
    return Response(data)


# ── Rewards ────────────────────────────────────────────────────────────────────

@extend_schema(
    tags=["rewards"],
    responses={200: OpenApiResponse(description="total_points + rewards list")},
    summary="Current user's reward history and points total",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_rewards(request):
    """Return all rewards earned by the current user and their running points total."""
    rewards = Reward.objects.filter(user=request.user)
    rewards.aggregate(total=Sum("points_earned"))  # kept for future analytics use
    return Response({
        "total_points": request.user.points,
        "rewards": RewardSerializer(rewards, many=True).data,
    })