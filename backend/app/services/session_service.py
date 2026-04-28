import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.models.account import Account
from app.models.enrolment import Enrolment
from app.models.session import OccurrenceException, RecurrenceRule, Session
from app.schemas.session import SessionCreateRequest, SessionUpdateRequest

logger = logging.getLogger(__name__)

VALID_DURATIONS = {30, 45, 60, 90, 120}


async def create_session(
    db: AsyncSession, tutor_id: uuid.UUID, data: SessionCreateRequest
) -> Session:
    if data.duration_minutes not in VALID_DURATIONS:
        raise ValidationError(detail="Invalid duration")

    end_time = data.start_time + timedelta(minutes=data.duration_minutes)

    conflicts = await _check_conflicts(db, tutor_id, data.start_time, end_time)
    if conflicts:
        raise ConflictError(
            detail="Session conflicts with existing schedule"
        )

    jitsi_room_name = None
    if data.mode in ("online", "hybrid"):
        short_id = str(uuid.uuid4())[:8]
        jitsi_room_name = f"rihla-{short_id}-{secrets.token_hex(4)}"

    session = Session(
        tutor_id=tutor_id,
        title=data.title,
        session_type=data.session_type,
        mode=data.mode,
        status="active",
        location_address=data.location_address,
        location_city=data.location_city,
        location_region=data.location_region,
        location_country=data.location_country,
        duration_minutes=data.duration_minutes,
        start_time=data.start_time,
        end_time=end_time,
        max_group_size=data.max_group_size,
        jitsi_room_name=jitsi_room_name,
        individual_rate_override=data.individual_rate_override,
        group_rate_override=data.group_rate_override,
        currency_override=data.currency_override,
        subject_id=data.subject_id,
        education_level_id=data.education_level_id,
    )
    db.add(session)
    await db.flush()

    if data.recurrence:
        recurrence = RecurrenceRule(
            session_id=session.id,
            frequency=data.recurrence.frequency,
            days_of_week=data.recurrence.days_of_week,
            start_date=data.recurrence.start_date,
            end_date=data.recurrence.end_date,
        )
        db.add(recurrence)

    await db.flush()
    logger.info("Session created: %s by tutor %s", session.id, tutor_id)
    return session


async def get_session(db: AsyncSession, session_id: uuid.UUID) -> Session:
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.recurrence_rule),
            selectinload(Session.enrolments),
        )
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError(detail="Session not found")
    return session


async def update_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    tutor_id: uuid.UUID,
    data: SessionUpdateRequest,
) -> Session:
    session = await get_session(db, session_id)
    if session.tutor_id != tutor_id:
        raise ForbiddenError(detail="Not your session")

    if data.title is not None:
        session.title = data.title
    if data.mode is not None:
        session.mode = data.mode
    if data.location_address is not None:
        session.location_address = data.location_address
    if data.location_city is not None:
        session.location_city = data.location_city
    if data.max_group_size is not None:
        session.max_group_size = data.max_group_size
    if data.start_time is not None:
        session.start_time = data.start_time
        duration = data.duration_minutes or session.duration_minutes
        session.end_time = data.start_time + timedelta(minutes=duration)
    if data.duration_minutes is not None:
        session.duration_minutes = data.duration_minutes
        session.end_time = session.start_time + timedelta(
            minutes=data.duration_minutes
        )

    await db.flush()
    return session


async def cancel_session(
    db: AsyncSession, session_id: uuid.UUID, tutor_id: uuid.UUID
) -> dict:
    """Cancel a session. Returns session and whether 48h rule was triggered."""
    session = await get_session(db, session_id)
    if session.tutor_id != tutor_id:
        raise ForbiddenError(detail="Not your session")

    within_48h = await is_within_48_hours(session)
    has_students = len(session.enrolments) > 0 if session.enrolments else False
    is_booking = session.session_type == "booking_meeting"

    session.status = "cancelled"
    await db.flush()

    return {
        "session": session,
        "within_48h": within_48h and has_students and not is_booking,
    }


async def is_within_48_hours(session: Session) -> bool:
    now = datetime.now(timezone.utc)
    return (session.start_time - now) < timedelta(hours=48)


async def get_tutor_sessions(
    db: AsyncSession,
    tutor_id: uuid.UUID,
    status: str | None = None,
    cursor: str | None = None,
    limit: int = 20,
) -> list[Session]:
    query = select(Session).where(Session.tutor_id == tutor_id)

    if status:
        query = query.where(Session.status == status)

    if cursor:
        query = query.where(Session.created_at < datetime.fromisoformat(cursor))

    query = query.order_by(Session.start_time.desc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_student_sessions(
    db: AsyncSession, student_id: uuid.UUID
) -> list[Session]:
    result = await db.execute(
        select(Session)
        .join(Enrolment, Enrolment.session_id == Session.id)
        .where(
            Enrolment.student_id == student_id,
            Enrolment.status == "active",
        )
        .order_by(Session.start_time.desc())
    )
    return list(result.scalars().all())


async def _check_conflicts(
    db: AsyncSession,
    tutor_id: uuid.UUID,
    start_time: datetime,
    end_time: datetime,
    exclude_session_id: uuid.UUID | None = None,
) -> list[Session]:
    query = select(Session).where(
        Session.tutor_id == tutor_id,
        Session.status.in_(["active", "draft"]),
        or_(
            and_(Session.start_time < end_time, Session.end_time > start_time),
        ),
    )
    if exclude_session_id:
        query = query.where(Session.id != exclude_session_id)

    result = await db.execute(query)
    return list(result.scalars().all())
