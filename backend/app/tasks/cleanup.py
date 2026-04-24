import logging
from datetime import datetime, timezone

from sqlalchemy import delete

from app.database import async_session_factory
from app.models.token import EmailVerificationToken, PasswordResetToken, RefreshToken

logger = logging.getLogger(__name__)


async def cleanup_expired_tokens() -> None:
    now = datetime.now(timezone.utc)
    async with async_session_factory() as db:
        r1 = await db.execute(
            delete(RefreshToken).where(RefreshToken.expires_at < now)
        )
        r2 = await db.execute(
            delete(PasswordResetToken).where(PasswordResetToken.expires_at < now)
        )
        r3 = await db.execute(
            delete(EmailVerificationToken).where(
                EmailVerificationToken.expires_at < now
            )
        )
        await db.commit()
        total = r1.rowcount + r2.rowcount + r3.rowcount
        if total:
            logger.info("Cleaned up %d expired tokens", total)
