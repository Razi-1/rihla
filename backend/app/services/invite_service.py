import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.models.enrolment import Enrolment
from app.models.invite import SessionInvite
from app.models.session import Session

logger = logging.getLogger(__name__)


async def create_invite(
    db: AsyncSession,
    session_id: uuid.UUID,
    student_id: uuid.UUID,
    tutor_id: uuid.UUID,
) -> SessionInvite:
    session = await db.get(Session, session_id)
    if not session:
        raise NotFoundError(detail="Session not found")
    if session.tutor_id != tutor_id:
        raise ForbiddenError(detail="Not your session")

    existing = await db.execute(
        select(SessionInvite).where(
            SessionInvite.session_id == session_id,
            SessionInvite.student_id == student_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError(detail="Student already invited")

    conflict_details = await _snapshot_conflicts(db, student_id, session)

    invite = SessionInvite(
        session_id=session_id,
        student_id=student_id,
        conflict_details=conflict_details,
    )
    db.add(invite)
    await db.flush()
    return invite


async def get_student_invites(
    db: AsyncSession, student_id: uuid.UUID
) -> list[SessionInvite]:
    result = await db.execute(
        select(SessionInvite)
        .options(selectinload(SessionInvite.session))
        .where(
            SessionInvite.student_id == student_id,
            SessionInvite.status == "pending",
        )
        .order_by(SessionInvite.created_at.desc())
    )
    return list(result.scalars().all())


async def get_invite(
    db: AsyncSession, invite_id: uuid.UUID
) -> SessionInvite:
    result = await db.execute(
        select(SessionInvite)
        .options(selectinload(SessionInvite.session))
        .where(SessionInvite.id == invite_id)
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise NotFoundError(detail="Invite not found")
    return invite


async def accept_invite(
    db: AsyncSession, invite_id: uuid.UUID, student_id: uuid.UUID
) -> Enrolment:
    invite = await get_invite(db, invite_id)
    if invite.student_id != student_id:
        raise ForbiddenError(detail="Not your invite")
    if invite.status != "pending":
        raise ValidationError(detail="Invite already responded to")

    invite.status = "accepted"

    enrolment = Enrolment(
        session_id=invite.session_id,
        student_id=student_id,
    )
    db.add(enrolment)
    await db.flush()
    return enrolment


async def decline_invite(
    db: AsyncSession,
    invite_id: uuid.UUID,
    student_id: uuid.UUID,
    note: str | None = None,
) -> SessionInvite:
    invite = await get_invite(db, invite_id)
    if invite.student_id != student_id:
        raise ForbiddenError(detail="Not your invite")
    if invite.status != "pending":
        raise ValidationError(detail="Invite already responded to")

    invite.status = "declined"
    invite.declined_note = note
    await db.flush()
    return invite


async def request_join_group(
    db: AsyncSession, session_id: uuid.UUID, student_id: uuid.UUID
) -> SessionInvite:
    session = await db.get(Session, session_id)
    if not session:
        raise NotFoundError(detail="Session not found")
    if session.session_type != "group_class":
        raise ValidationError(detail="Can only request to join group classes")

    if session.max_group_size:
        enrolled_count_result = await db.execute(
            select(Enrolment).where(
                Enrolment.session_id == session_id,
                Enrolment.status == "active",
            )
        )
        enrolled = len(enrolled_count_result.scalars().all())
        if enrolled >= session.max_group_size:
            raise ValidationError(detail="Class is full")

    existing = await db.execute(
        select(SessionInvite).where(
            SessionInvite.session_id == session_id,
            SessionInvite.student_id == student_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError(detail="Already requested or invited")

    invite = SessionInvite(
        session_id=session_id,
        student_id=student_id,
        status="pending",
    )
    db.add(invite)
    await db.flush()
    return invite


async def _snapshot_conflicts(
    db: AsyncSession, student_id: uuid.UUID, session: Session
) -> dict | None:
    result = await db.execute(
        select(Session)
        .join(Enrolment, Enrolment.session_id == Session.id)
        .where(
            Enrolment.student_id == student_id,
            Enrolment.status == "active",
            Session.start_time < session.end_time,
            Session.end_time > session.start_time,
        )
    )
    conflicts = result.scalars().all()
    if not conflicts:
        return None

    return {
        "conflicting_sessions": [
            {
                "id": str(c.id),
                "title": c.title,
                "start_time": c.start_time.isoformat(),
                "end_time": c.end_time.isoformat(),
            }
            for c in conflicts
        ]
    }
