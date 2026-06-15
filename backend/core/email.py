import logging

from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, template: str, context: dict) -> bool:
    """Render template pair and send via configured email backend (Resend in prod, console in dev)."""
    try:
        html = render_to_string(f"emails/{template}.html", context)
        text = render_to_string(f"emails/{template}.txt", context)
        send_mail(subject, text, None, [to], html_message=html)
        return True
    except Exception:
        logger.exception("Email delivery failed to %s (template=%s)", to, template)
        return False
