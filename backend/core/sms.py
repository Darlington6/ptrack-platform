import logging

logger = logging.getLogger(__name__)


def send_sms(to: str, body: str) -> bool:
    """Console-only SMS stub. Replace with Africa's Talking / Termii when budget allows."""
    logger.info("SMS [%s]: %s", to, body)
    return True
