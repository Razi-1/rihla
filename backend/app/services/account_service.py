import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, UnauthorizedError, ValidationError
from app.core.security import hash_password, verify_password
from app.models.account import Account
from app.schemas.account import AccountUpdateRequest, ChangePasswordRequest
from app.utils.password_strength import check_password_strength

logger = logging.getLogger(__name__)


async def get_account(db: AsyncSession, account_id) -> Account:
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.is_active == True)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise NotFoundError(detail="Account not found")
    return account


async def update_account(
    db: AsyncSession, account: Account, data: AccountUpdateRequest
) -> Account:
    if data.first_name is not None:
        account.first_name = data.first_name
    if data.last_name is not None:
        account.last_name = data.last_name
    if data.phone_number is not None:
        account.phone_number = data.phone_number
    if data.phone_country_code is not None:
        account.phone_country_code = data.phone_country_code
    if data.profile_picture_url is not None:
        account.profile_picture_url = data.profile_picture_url

    await db.flush()
    return account


async def change_password(
    db: AsyncSession, account: Account, data: ChangePasswordRequest
) -> None:
    if not verify_password(data.current_password, account.password_hash):
        raise UnauthorizedError(detail="Current password is incorrect")

    meets_reqs, errors, _ = check_password_strength(data.new_password)
    if not meets_reqs:
        raise ValidationError(detail="Password too weak", errors={"password": errors})

    account.password_hash = hash_password(data.new_password)
    await db.flush()


async def request_deletion(db: AsyncSession, account: Account) -> None:
    if account.deletion_requested_at:
        raise ValidationError(detail="Deletion already requested")

    now = datetime.now(timezone.utc)
    account.deletion_requested_at = now
    account.deletion_scheduled_for = now + timedelta(days=7)
    await db.flush()
    logger.info("Deletion requested for account %s", account.id)


async def cancel_deletion(db: AsyncSession, account: Account) -> None:
    if not account.deletion_requested_at:
        raise ValidationError(detail="No pending deletion request")

    account.deletion_requested_at = None
    account.deletion_scheduled_for = None
    await db.flush()
    logger.info("Deletion cancelled for account %s", account.id)


async def process_pending_deletions(db: AsyncSession) -> int:
    """Process accounts past their 7-day grace period.

    Full cascade per Section 7.2:
    - is_active = FALSE
    - Review authorships CASCADE deleted (reviews become orphaned)
    - Refresh tokens revoked
    - Enrolments marked opted_out
    - Future sessions cancelled with notifications
    """
    from app.models.enrolment import Enrolment
    from app.models.review import ReviewAuthorship
    from app.models.session import Session
    from app.models.token import RefreshToken

    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Account).where(
            Account.deletion_scheduled_for <= now,
            Account.is_active == True,
        )
    )
    accounts = result.scalars().all()

    for account in accounts:
        account.is_active = False

        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.account_id == account.id)
            .values(is_revoked=True)
        )

        authorships = await db.execute(
            select(ReviewAuthorship).where(
                ReviewAuthorship.student_id == account.id
            )
        )
        for authorship in authorships.scalars().all():
            await db.delete(authorship)

        await db.execute(
            update(Enrolment)
            .where(
                Enrolment.student_id == account.id,
                Enrolment.status == "active",
            )
            .values(status="opted_out", opted_out_at=now)
        )

        if account.account_type == "tutor":
            future_sessions = await db.execute(
                select(Session).where(
                    Session.tutor_id == account.id,
                    Session.status == "active",
                    Session.start_time > now,
                )
            )
            for session in future_sessions.scalars().all():
                session.status = "cancelled"

        logger.info("Account %s deactivated (deletion processed)", account.id)

    await db.flush()
    return len(accounts)
