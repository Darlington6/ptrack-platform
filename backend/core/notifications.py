def notify(user, category: str, title: str, body: str, action_url: str = "") -> None:
    """Create an in-app Notification for *user*. Fire-and-forget — never raises."""
    try:
        from .models import Notification

        Notification.objects.create(
            recipient=user,
            category=category,
            title=title,
            body=body,
            action_url=action_url,
        )
    except Exception:
        import logging

        logging.getLogger(__name__).exception(
            "Failed to create notification for user %s", getattr(user, "pk", "?")
        )
