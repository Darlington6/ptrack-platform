"""
send_push(user, title, body, url, icon_url)

Delivers a web push notification to all active PushSubscription records for
the given user. Inactive or expired subscriptions are marked is_active=False.
"""

import json
import logging

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def send_push(
    user,
    title: str,
    body: str,
    url: str = "/dashboard",
    icon_url: str | None = None,
) -> int:
    """Send a web push to all active subscriptions for *user*.

    Returns the number of successful deliveries.
    """
    from pywebpush import WebPushException, webpush  # type: ignore[import-untyped]

    from .models import PushSubscription

    vapid_private_key = getattr(settings, "VAPID_PRIVATE_KEY", "")
    vapid_subject = getattr(settings, "VAPID_SUBJECT", "")

    if not vapid_private_key or not vapid_subject:
        logger.warning("VAPID keys not configured — skipping push for user %s", user.pk)
        return 0

    payload = json.dumps(
        {
            "title": title,
            "body": body,
            "url": url,
            "icon": icon_url or "/icons/icon-192.png",
        }
    )

    subs = PushSubscription.objects.filter(user=user, is_active=True)
    sent = 0

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=vapid_private_key,
                vapid_claims={"sub": vapid_subject},
            )
            sub.last_used_at = timezone.now()
            sub.save(update_fields=["last_used_at"])
            sent += 1
        except WebPushException as exc:
            response = getattr(exc, "response", None)
            status = getattr(response, "status_code", None)
            if status in (404, 410):
                # Subscription expired or was explicitly revoked
                sub.is_active = False
                sub.save(update_fields=["is_active"])
            else:
                logger.error("Push failed for sub %s: %s", sub.pk, exc)

    return sent
