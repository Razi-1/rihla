import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.reliability import compute_reliability
from app.ml.sentiment import compute_tutor_sentiment
from app.models.account import Account

logger = logging.getLogger(__name__)


async def recompute_all_vectors(db: AsyncSession) -> int:
    result = await db.execute(
        select(Account.id).where(
            Account.account_type == "tutor",
            Account.is_active == True,
        )
    )
    tutor_ids = [row[0] for row in result.all()]

    count = 0
    for tutor_id in tutor_ids:
        await compute_reliability(db, tutor_id)
        await compute_tutor_sentiment(db, tutor_id)
        count += 1

    await db.flush()
    logger.info("Recomputed ML vectors for %d tutors", count)
    return count
