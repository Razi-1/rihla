import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.models.enrolment import Enrolment

logger = logging.getLogger(__name__)


async def get_student_enrolments(
    db: AsyncSession, student_id: uuid.UUID
) -> list[Enrolment]:
    result = await db.execute(
        select(Enrolment)
        .options(selectinload(Enrolment.session))
        .where(
            Enrolment.student_id == student_id,
            Enrolment.status == "active",
        )
        .order_by(Enrolment.enrolled_at.desc())
    )
    return list(result.scalars().all())


async def opt_out(
    db: AsyncSession, enrolment_id: uuid.UUID, student_id: uuid.UUID
) -> Enrolment:
    result = await db.execute(
        select(Enrolment).where(Enrolment.id == enrolment_id)
    )
    enrolment = result.scalar_one_or_none()
    if not enrolment:
        raise NotFoundError(detail="Enrolment not found")
    if enrolment.student_id != student_id:
        raise ForbiddenError(detail="Not your enrolment")
    if enrolment.status == "opted_out":
        raise ValidationError(detail="Already opted out")

    enrolment.status = "opted_out"
    enrolment.opted_out_at = datetime.now(timezone.utc)
    await db.flush()

    logger.info("Student %s opted out of session %s", student_id, enrolment.session_id)
    return enrolment
