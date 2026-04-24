import logging

from app.database import async_session_factory
from app.ml.vectors import recompute_all_vectors

logger = logging.getLogger(__name__)


async def recompute_vectors() -> None:
    async with async_session_factory() as db:
        count = await recompute_all_vectors(db)
        await db.commit()
        logger.info("ML vector recomputation complete for %d tutors", count)
