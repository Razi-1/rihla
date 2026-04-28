import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.student import StudentProfile, StudentSubject
from app.schemas.student import StudentProfileUpdateRequest

import logging

logger = logging.getLogger(__name__)


async def get_student_dashboard(db: AsyncSession, account_id: uuid.UUID) -> dict:
    from app.models.session import Session
    from app.models.enrolment import Enrolment
    from app.models.invite import SessionInvite

    upcoming_q = (
        select(func.count())
        .select_from(Enrolment)
        .join(Session, Enrolment.session_id == Session.id)
        .where(
            Enrolment.student_id == account_id,
            Enrolment.status == "active",
            Session.status == "active",
        )
    )
    upcoming_result = await db.execute(upcoming_q)
    upcoming_sessions = upcoming_result.scalar() or 0

    active_q = (
        select(func.count(func.distinct(Session.id)))
        .select_from(Enrolment)
        .join(Session, Enrolment.session_id == Session.id)
        .where(
            Enrolment.student_id == account_id,
            Enrolment.status == "active",
        )
    )
    active_result = await db.execute(active_q)
    active_classes = active_result.scalar() or 0

    pending_q = (
        select(func.count())
        .select_from(SessionInvite)
        .where(
            SessionInvite.student_id == account_id,
            SessionInvite.status == "pending",
        )
    )
    pending_result = await db.execute(pending_q)
    pending_invites = pending_result.scalar() or 0

    from app.models.account import Account

    classes_q = (
        select(Session, Account)
        .join(Enrolment, Enrolment.session_id == Session.id)
        .join(Account, Session.tutor_id == Account.id)
        .where(
            Enrolment.student_id == account_id,
            Enrolment.status == "active",
        )
        .order_by(Session.start_time.desc())
        .limit(10)
    )
    classes_result = await db.execute(classes_q)
    active_classes_list = [
        {
            "id": str(session.id),
            "title": session.title,
            "tutor_name": f"{tutor.first_name} {tutor.last_name}",
            "session_type": session.session_type,
            "start_time": session.start_time.isoformat(),
            "mode": session.mode,
        }
        for session, tutor in classes_result.all()
    ]

    return {
        "upcoming_sessions": upcoming_sessions,
        "active_classes": active_classes,
        "pending_invites": pending_invites,
        "next_session": None,
        "recent_invites": [],
        "active_classes_list": active_classes_list,
    }


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
