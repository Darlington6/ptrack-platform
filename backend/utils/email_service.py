import resend
from django.conf import settings

resend.api_key = settings.RESEND_API_KEY


def send_email(to_email, subject, html):
    try:
        resend.Emails.send(
            {
                "from": "onboarding@resend.dev",
                "to": to_email,
                "subject": subject,
                "html": html,
            }
        )
        return True

    except Exception as e:
        print("Email failed:", e)
        return False
