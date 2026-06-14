"""
Business-logic services for user accounts.

update_streak  — called after every report or recycling activity submission.
compute_impact — returns a dict of environmental impact estimates for a user.
"""

from datetime import timedelta

from django.utils import timezone


def update_streak(user) -> None:
    """
    Compare last_activity_date to today and update current/longest streak.

    Rules:
      - Same day as last activity  → no change (already counted today)
      - Consecutive day            → increment streak
      - Gap > 1 day               → reset streak to 1
    """
    today = timezone.localdate()
    last = user.last_activity_date

    if last is None:
        user.current_streak = 1
    elif last == today:
        return
    elif last == today - timedelta(days=1):
        user.current_streak += 1
    else:
        user.current_streak = 1

    user.last_activity_date = today
    if user.current_streak > user.longest_streak:
        user.longest_streak = user.current_streak

    user.save(update_fields=["current_streak", "longest_streak", "last_activity_date"])


def compute_impact(user) -> dict:
    """
    Estimate the user's environmental impact from their activity.

    Assumptions (documented):
      - Each waste report represents ~0.5 kg of plastic identified/removed.
      - Each recycling activity represents ~1.2 kg of plastic processed.
      - Diverting 1 kg of plastic from landfill saves ~1.5 kg of CO2-equivalent.
      - A standard 500 ml PET bottle weighs ~20 g → 50 bottles per kg.
    """
    from reports.models import RecyclingActivity, WasteReport

    total_reports = WasteReport.objects.filter(user=user).count()
    total_recycling = RecyclingActivity.objects.filter(user=user).count()

    estimated_plastic_kg = round(total_reports * 0.5 + total_recycling * 1.2, 2)
    estimated_bottles_equivalent = int(estimated_plastic_kg * 50)
    co2_saved_kg = round(estimated_plastic_kg * 1.5, 2)

    return {
        "total_reports": total_reports,
        "total_recycling": total_recycling,
        "total_points": user.points,
        "estimated_plastic_kg": estimated_plastic_kg,
        "estimated_bottles_equivalent": estimated_bottles_equivalent,
        "co2_saved_kg": co2_saved_kg,
    }
