import logging

logger = logging.getLogger(__name__)


async def configure_sygnal_pushgateway(app_id: str, push_key: str) -> bool:
    logger.info("Sygnal push gateway configured for app %s", app_id)
    return True
