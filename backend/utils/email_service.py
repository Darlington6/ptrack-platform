from django.conf import settings
from django.core.mail import send_mail


def send_email(to_email, subject, html):
    try:
        send_mail(
            subject=subject,
            message="",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print("Email failed:", e)
        return False
