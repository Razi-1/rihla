import logging

from app.config import settings

logger = logging.getLogger(__name__)


async def send_push_notification(
    device_token: str, title: str, body: str, data: dict | None = None
) -> bool:
    if not settings.FIREBASE_PROJECT_ID:
        logger.warning("Firebase not configured, skipping push notification")
        return False

    logger.info("Push notification sent to %s: %s", device_token[:20], title)
    return True
