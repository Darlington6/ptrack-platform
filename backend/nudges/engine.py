"""
Nudges rules engine.

get_active_nudges_for(user, limit=3) evaluates all active NudgeRules against
the user's current state and returns the ones that fire (respecting cooldowns).
"""

from datetime import date, datetime, timedelta
from typing import Callable

from django.utils import timezone


def get_active_nudges_for(user, limit: int = 3) -> list:
    from .models import NudgeRule, UserNudgeLog

    rules = NudgeRule.objects.filter(is_active=True).order_by("priority")
    active: list = []

    for rule in rules:
        if len(active) >= limit:
            break

        # Enforce cooldown: skip if the rule was shown within cooldown_hours
        last_log = UserNudgeLog.objects.filter(user=user, rule=rule).order_by("-shown_at").first()
        if last_log:
            cooldown_cutoff = timezone.now() - timedelta(hours=rule.cooldown_hours)
            if last_log.shown_at > cooldown_cutoff:
                continue

        if _evaluate(user, rule):
            active.append(rule)

    return active


# ── Rule evaluators ───────────────────────────────────────────────────────────

_EVALUATORS: dict[str, Callable[..., bool]] = {}


def _register(code: str):
    def decorator(fn):
        _EVALUATORS[code] = fn
        return fn

    return decorator


def _evaluate(user, rule) -> bool:
    evaluator = _EVALUATORS.get(rule.code)
    if evaluator:
        return evaluator(user, rule)
    return False


@_register("STREAK_WARNING")
def _streak_warning(user, rule) -> bool:
    """Fire when the user has an active streak but hasn't acted in the last 20 hours."""
    if user.current_streak < 2 or user.last_activity_date is None:
        return False
    last_dt = datetime.combine(user.last_activity_date, datetime.min.time())
    last_aware = timezone.make_aware(last_dt)
    return last_aware < timezone.now() - timedelta(hours=20)


@_register("WEEKLY_GOAL_NEAR")
def _weekly_goal_near(user, rule) -> bool:
    """Fire when weekly reports are between 60 % and 100 % of the user's weekly goal."""
    if user.weekly_goal <= 0:
        return False
    week_start = _week_start()
    count = _weekly_report_count(user, week_start)
    return 0.6 * user.weekly_goal <= count < user.weekly_goal


@_register("WEEKLY_GOAL_MET")
def _weekly_goal_met(user, rule) -> bool:
    """Fire when the user has met or exceeded their weekly report goal."""
    if user.weekly_goal <= 0:
        return False
    count = _weekly_report_count(user, _week_start())
    return count >= user.weekly_goal


@_register("COMMUNITY_ACTIVE")
def _community_active(user, rule) -> bool:
    """Fire when the user's sector has seen more than 10 reports this week."""
    from accounts.models import User as UserModel
    from reports.models import WasteReport

    sector_users = UserModel.objects.filter(sector=user.sector)
    since = timezone.now() - timedelta(days=7)
    return WasteReport.objects.filter(user__in=sector_users, created_at__gte=since).count() > 10


@_register("FIRST_REPORT_REMINDER")
def _first_report_reminder(user, rule) -> bool:
    """Fire when a user who registered > 24 h ago has never submitted a report."""
    from reports.models import WasteReport

    if WasteReport.objects.filter(user=user).exists():
        return False
    return user.date_joined < timezone.now() - timedelta(hours=24)


@_register("BADGE_PROGRESS")
def _badge_progress(user, rule) -> bool:
    """Fire when the user is within 3 reports of the next badge threshold."""
    from reports.models import WasteReport

    total = WasteReport.objects.filter(user=user).count()
    thresholds = [5, 10, 25, 50, 100, 250]
    return any(t - 3 <= total < t for t in thresholds)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _week_start() -> date:
    today = timezone.now().date()
    return today - timedelta(days=today.weekday())


def _weekly_report_count(user, week_start: date) -> int:
    from reports.models import WasteReport

    return WasteReport.objects.filter(user=user, created_at__date__gte=week_start).count()
