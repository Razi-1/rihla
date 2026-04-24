import logging

from app.database import async_session_factory
from app.services.account_service import process_pending_deletions

logger = logging.getLogger(__name__)


async def process_deletions() -> None:
    async with async_session_factory() as db:
        count = await process_pending_deletions(db)
        await db.commit()
        if count:
            logger.info("Processed %d account deletions", count)
