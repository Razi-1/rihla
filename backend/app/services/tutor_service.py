import logging
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.account import Account
from app.models.review import Review, ReviewAuthorship
from app.models.ml import TutorSentiment
from app.models.tutor import TutorContact, TutorProfile, TutorSubject, TutorWorkingHours
from app.schemas.tutor import (
    PricingUpdateRequest,
    TutorProfileUpdateRequest,
    TutorProfileResponse,
    TutorSubjectResponse,
    WorkingHoursRequest,
    WorkingHoursResponse,
)

logger = logging.getLogger(__name__)


async def get_tutor_profile(db: AsyncSession, account_id: uuid.UUID) -> TutorProfile:
    result = await db.execute(
        select(TutorProfile)
        .options(
            selectinload(TutorProfile.subjects),
            selectinload(TutorProfile.working_hours),
        )
        .where(TutorProfile.account_id == account_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundError(detail="Tutor profile not found")
    return profile


async def update_tutor_profile(
    db: AsyncSession, account_id: uuid.UUID, data: TutorProfileUpdateRequest
) -> TutorProfile:
    profile = await get_tutor_profile(db, account_id)

    if data.bio is not None:
        profile.bio = data.bio
    if data.mode_of_tuition is not None:
        profile.mode_of_tuition = data.mode_of_tuition
    if data.country_id is not None:
        profile.country_id = data.country_id
    if data.region_id is not None:
        profile.region_id = data.region_id
    if data.city_id is not None:
        profile.city_id = data.city_id
    if data.timezone is not None:
        profile.timezone = data.timezone

    if data.subjects is not None:
        existing = await db.execute(
            select(TutorSubject).where(TutorSubject.tutor_id == account_id)
        )
        for sub in existing.scalars().all():
            await db.delete(sub)

        for sub_data in data.subjects:
            db.add(
                TutorSubject(
                    tutor_id=account_id,
                    subject_id=sub_data.subject_id,
                    education_level_id=sub_data.education_level_id,
                )
            )

    await _update_completeness(db, profile, account_id)
    await db.flush()
    return profile


async def update_pricing(
    db: AsyncSession, account_id: uuid.UUID, data: PricingUpdateRequest
) -> TutorProfile:
    profile = await get_tutor_profile(db, account_id)

    if data.individual_rate is not None:
        profile.individual_rate = data.individual_rate
    if data.group_rate is not None:
        profile.group_rate = data.group_rate
    if data.currency is not None:
        profile.currency = data.currency

    await _update_completeness(db, profile, account_id)
    await db.flush()
    return profile


async def update_working_hours(
    db: AsyncSession, account_id: uuid.UUID, data: WorkingHoursRequest
) -> list[TutorWorkingHours]:
    existing = await db.execute(
        select(TutorWorkingHours).where(TutorWorkingHours.tutor_id == account_id)
    )
    for wh in existing.scalars().all():
        await db.delete(wh)

    new_hours = []
    for slot in data.slots:
        wh = TutorWorkingHours(
            tutor_id=account_id,
            day_of_week=slot.day_of_week,
            start_time=slot.start_time,
            end_time=slot.end_time,
            is_working=slot.is_working,
            timezone=data.timezone,
        )
        db.add(wh)
        new_hours.append(wh)

    await db.flush()
    return new_hours


async def _update_completeness(
    db: AsyncSession, profile: TutorProfile, account_id: uuid.UUID
) -> None:
    subjects_result = await db.execute(
        select(func.count()).select_from(TutorSubject).where(
            TutorSubject.tutor_id == account_id
        )
    )
    subject_count = subjects_result.scalar()

    has_subjects = subject_count > 0
    has_mode = profile.mode_of_tuition is not None
    has_rate = (
        profile.individual_rate is not None or profile.group_rate is not None
    )

    profile.is_profile_complete = has_subjects and has_mode and has_rate


async def get_tutor_stats(
    db: AsyncSession, tutor_id: uuid.UUID
) -> dict:
    review_result = await db.execute(
        select(
            func.avg(Review.rating),
            func.count(Review.id),
        ).where(
            Review.tutor_id == tutor_id,
            Review.is_deleted == False,
        )
    )
    avg_rating, review_count = review_result.one()

    sentiment_result = await db.execute(
        select(TutorSentiment).where(TutorSentiment.tutor_id == tutor_id)
    )
    sentiment = sentiment_result.scalar_one_or_none()

    return {
        "average_rating": float(avg_rating) if avg_rating else None,
        "review_count": review_count,
        "sentiment_summary": sentiment.summary_text if sentiment else None,
    }


async def get_tutor_dashboard(db: AsyncSession, account_id: uuid.UUID) -> dict:
    from app.models.session import Session
    from app.models.enrolment import Enrolment

    session_q = (
        select(func.count())
        .select_from(Session)
        .where(Session.tutor_id == account_id, Session.status == "active")
    )
    session_result = await db.execute(session_q)
    total_classes = session_result.scalar() or 0

    student_q = (
        select(func.count(func.distinct(Enrolment.student_id)))
        .select_from(Enrolment)
        .join(Session, Enrolment.session_id == Session.id)
        .where(Session.tutor_id == account_id, Enrolment.status == "active")
    )
    student_result = await db.execute(student_q)
    active_students = student_result.scalar() or 0

    profile = await get_tutor_profile(db, account_id)

    steps = [
        {"key": "bio", "label": "Add a bio", "completed": bool(profile.bio)},
        {"key": "mode", "label": "Set tuition mode", "completed": bool(profile.mode_of_tuition)},
        {"key": "rate", "label": "Set pricing", "completed": profile.individual_rate is not None or profile.group_rate is not None},
        {"key": "subjects", "label": "Add subjects", "completed": len(profile.subjects) > 0 if profile.subjects else False},
    ]
    completed_count = sum(1 for s in steps if s["completed"])
    profile_completeness = int((completed_count / len(steps)) * 100)

    return {
        "upcoming_sessions": 0,
        "active_students": active_students,
        "total_classes": total_classes,
        "profile_completeness": profile_completeness,
        "completion_steps": steps,
        "next_session": None,
    }


async def add_contact(
    db: AsyncSession, tutor_id: uuid.UUID, contact_id: uuid.UUID, contact_type: str
) -> None:
    existing = await db.execute(
        select(TutorContact).where(
            TutorContact.tutor_id == tutor_id,
            TutorContact.contact_account_id == contact_id,
        )
    )
    if existing.scalar_one_or_none():
        return

    db.add(
        TutorContact(
            tutor_id=tutor_id,
            contact_account_id=contact_id,
            contact_type=contact_type,
        )
    )
    await db.flush()
