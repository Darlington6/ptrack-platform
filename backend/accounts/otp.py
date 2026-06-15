import hashlib
import random
import string
from datetime import timedelta

from django.utils import timezone


def _generate_code() -> str:
    return "".join(random.choices(string.digits, k=6))


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def create_verification_code(user, channel: str, purpose: str, ttl_minutes: int = 10) -> str:
    """
    Invalidate existing unused codes for the same slot, create a new one,
    and return the plain-text 6-digit OTP. The OTP is never stored.
    """
    from core.models import VerificationCode

    VerificationCode.objects.filter(
        user=user, channel=channel, purpose=purpose, is_used=False
    ).update(is_used=True)

    code = _generate_code()
    VerificationCode.objects.create(
        user=user,
        code_hash=_hash_code(code),
        channel=channel,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=ttl_minutes),
    )
    return code


def verify_code(user, channel: str, purpose: str, code: str) -> bool:
    """
    Return True if *code* matches the latest active VerificationCode for this
    user/channel/purpose slot. Marks the code as used on success; increments
    attempts on failure. Returns False after 5 failed attempts or expiry.
    """
    from core.models import VerificationCode

    vc = (
        VerificationCode.objects.filter(
            user=user,
            channel=channel,
            purpose=purpose,
            is_used=False,
            expires_at__gt=timezone.now(),
        )
        .order_by("-created_at")
        .first()
    )

    if vc is None:
        return False

    if vc.attempts >= 5:
        return False

    if vc.code_hash != _hash_code(code):
        vc.attempts += 1
        vc.save(update_fields=["attempts"])
        return False

    vc.is_used = True
    vc.save(update_fields=["is_used"])
    return True
