import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.student import StudentProfile, StudentSubject
from app.schemas.student import StudentProfileUpdateRequest

import logging

logger = logging.getLogger(__name__)


async def get_student_profile(
    db: AsyncSession, account_id: uuid.UUID
) -> StudentProfile:
    result = await db.execute(
        select(StudentProfile)
        .options(selectinload(StudentProfile.subjects))
        .where(StudentProfile.account_id == account_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundError(detail="Student profile not found")
    return profile


async def update_student_profile(
    db: AsyncSession, account_id: uuid.UUID, data: StudentProfileUpdateRequest
) -> StudentProfile:
    profile = await get_student_profile(db, account_id)

    if data.education_level_id is not None:
        profile.education_level_id = data.education_level_id
    if data.bio is not None:
        profile.bio = data.bio

    if data.subjects is not None:
        existing = await db.execute(
            select(StudentSubject).where(StudentSubject.student_id == account_id)
        )
        for sub in existing.scalars().all():
            await db.delete(sub)

        for sub_data in data.subjects:
            db.add(
                StudentSubject(
                    student_id=account_id,
                    subject_id=sub_data.subject_id,
                    education_level_id=sub_data.education_level_id,
                )
            )

    await db.flush()
    return profile
