import logging
from datetime import datetime, timezone

from sqlalchemy import select

from app.database import async_session_factory
from app.models.account import Account

logger = logging.getLogger(__name__)


async def check_birthdays() -> None:
    async with async_session_factory() as db:
        today = datetime.now(timezone.utc).date()
        result = await db.execute(
            select(Account).where(
                Account.is_age_restricted == True,
                Account.is_active == True,
            )
        )
        accounts = result.scalars().all()

        lifted = 0
        for account in accounts:
            dob = account.date_of_birth
            age = (
                today.year
                - dob.year
                - ((today.month, today.day) < (dob.month, dob.day))
            )
            if age >= 15:
                account.is_age_restricted = False
                lifted += 1

        await db.commit()
        if lifted:
            logger.info("Lifted age restriction for %d accounts", lifted)
