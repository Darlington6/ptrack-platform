import logging

logger = logging.getLogger(__name__)


def send_sms(to: str, body: str) -> bool:
    """Console-only SMS stub. Replace with Africa's Talking / Termii when budget allows."""
    logger.info("SMS dispatch queued (body length: %d)", len(body))
    return True
