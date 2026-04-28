import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_role
from app.database import get_db
from app.models.account import Account
from app.models.enrolment import Enrolment
from app.models.session import Session
from app.schemas.common import SuccessResponse
from app.schemas.session import BookMeetingRequest, SessionCreateRequest, SessionResponse, SessionUpdateRequest
from app.services import chat_service, notification_service, session_service

router = APIRouter()


def _session_subject_fields(session: Session) -> dict:
    return {
        "subject_id": session.subject_id,
        "education_level_id": session.education_level_id,
        "subject_name": session.subject.name if session.subject else None,
        "education_level_name": session.education_level.name if session.education_level else None,
    }


@router.post("", response_model=SessionResponse)
async def create_session(
    data: SessionCreateRequest,
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    session = await session_service.create_session(db, current_user.id, data)
    return SessionResponse(
        id=session.id,
        tutor_id=session.tutor_id,
        title=session.title,
        session_type=session.session_type,
        mode=session.mode,
        status=session.status,
        location_city=session.location_city,
        location_region=session.location_region,
        location_country=session.location_country,
        location_address=session.location_address,
        duration_minutes=session.duration_minutes,
        start_time=session.start_time,
        end_time=session.end_time,
        max_group_size=session.max_group_size,
        jitsi_room_name=session.jitsi_room_name,
        individual_rate_override=session.individual_rate_override,
        group_rate_override=session.group_rate_override,
        currency_override=session.currency_override,
        **_session_subject_fields(session),
        created_at=session.created_at,
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    session = await session_service.get_session(db, session_id)
    tutor_account = await db.get(Account, session.tutor_id)
    tutor_name = f"{tutor_account.first_name} {tutor_account.last_name}" if tutor_account else None

    is_enrolled = False
    if current_user.account_type == "student":
        enrolled_q = await db.execute(
            select(Enrolment).where(
                Enrolment.session_id == session_id,
                Enrolment.student_id == current_user.id,
                Enrolment.status == "active",
            )
        )
        is_enrolled = enrolled_q.scalar_one_or_none() is not None

    return SessionResponse(
        id=session.id,
        tutor_id=session.tutor_id,
        tutor_name=tutor_name,
        title=session.title,
        session_type=session.session_type,
        mode=session.mode,
        status=session.status,
        location_city=session.location_city,
        location_region=session.location_region,
        location_country=session.location_country,
        location_address=session.location_address,
        duration_minutes=session.duration_minutes,
        start_time=session.start_time,
        end_time=session.end_time,
        max_group_size=session.max_group_size,
        jitsi_room_name=session.jitsi_room_name,
        individual_rate_override=session.individual_rate_override,
        group_rate_override=session.group_rate_override,
        currency_override=session.currency_override,
        **_session_subject_fields(session),
        enrolled_count=len(session.enrolments),
        is_recurring=session.recurrence_rule is not None,
        is_enrolled=is_enrolled,
        created_at=session.created_at,
    )


@router.put("/{session_id}", response_model=SuccessResponse)
async def update_session(
    session_id: uuid.UUID,
    data: SessionUpdateRequest,
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    await session_service.update_session(db, session_id, current_user.id, data)
    return SuccessResponse(message="Session updated")


@router.delete("/{session_id}", response_model=SuccessResponse)
async def cancel_session(
    session_id: uuid.UUID,
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    await session_service.cancel_session(db, session_id, current_user.id)
    return SuccessResponse(message="Session cancelled")


@router.get("/{session_id}/jitsi-token")
async def get_jitsi_token(
    session_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    session = await session_service.get_session(db, session_id)
    if not session.jitsi_room_name:
        from app.core.exceptions import ValidationError
        raise ValidationError(detail="This session has no video call")

    is_tutor = session.tutor_id == current_user.id
    if not is_tutor:
        from sqlalchemy import select as sa_select
        from app.models.enrolment import Enrolment
        enrolled = await db.execute(
            sa_select(Enrolment).where(
                Enrolment.session_id == session_id,
                Enrolment.student_id == current_user.id,
                Enrolment.status == "active",
            )
        )
        if not enrolled.scalar_one_or_none():
            from app.core.exceptions import ForbiddenError
            raise ForbiddenError(detail="Not enrolled in this session")

    from app.core.security import create_jitsi_jwt
    token = create_jitsi_jwt(
        room_name=session.jitsi_room_name,
        user_name=f"{current_user.first_name} {current_user.last_name}",
        user_email=current_user.email,
        is_moderator=is_tutor,
    )
    return {
        "data": {
            "token": token,
            "room_name": session.jitsi_room_name,
            "domain": "localhost:8443",
        }
    }


@router.post("/{session_id}/request-join", response_model=SuccessResponse)
async def request_join(
    session_id: uuid.UUID,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    session = await session_service.get_session(db, session_id)
    if session.session_type != "group_class":
        from app.core.exceptions import ValidationError
        raise ValidationError(detail="Can only join group classes")
    if session.status != "active":
        from app.core.exceptions import ValidationError
        raise ValidationError(detail="Session is not active")
    if session.max_group_size:
        active_count = sum(1 for e in (session.enrolments or []) if e.status == "active")
        if active_count >= session.max_group_size:
            from app.core.exceptions import ValidationError
            raise ValidationError(detail="Class is full")

    existing = await db.execute(
        select(Enrolment).where(
            Enrolment.session_id == session_id,
            Enrolment.student_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        from app.core.exceptions import ConflictError
        raise ConflictError(detail="Already enrolled in this class")

    enrolment = Enrolment(
        session_id=session_id,
        student_id=current_user.id,
        status="active",
    )
    db.add(enrolment)
    await db.flush()

    await chat_service.get_or_create_dm_room(db, current_user.id, session.tutor_id)
    await db.flush()

    return SuccessResponse(message="Successfully joined the class")


@router.post("/{session_id}/cancel-booking", response_model=SuccessResponse)
async def cancel_booking(
    session_id: uuid.UUID,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    from app.core.exceptions import ForbiddenError, ValidationError

    session = await session_service.get_session(db, session_id)
    if session.session_type != "booking_meeting":
        raise ValidationError(detail="Can only cancel booking meetings")

    enrolled = await db.execute(
        select(Enrolment).where(
            Enrolment.session_id == session_id,
            Enrolment.student_id == current_user.id,
            Enrolment.status == "active",
        )
    )
    if not enrolled.scalar_one_or_none():
        raise ForbiddenError(detail="Not enrolled in this session")

    session.status = "cancelled"

    student_name = f"{current_user.first_name} {current_user.last_name}"
    await notification_service.create_notification(
        db,
        session.tutor_id,
        title="Booking Cancelled",
        body=f"{student_name} cancelled the booking: {session.title}",
        notification_type="booking_cancelled",
        related_entity_id=session_id,
        related_entity_type="session",
    )
    await notification_service.create_notification(
        db,
        current_user.id,
        title="Booking Cancelled",
        body=f"You cancelled the booking: {session.title}",
        notification_type="booking_cancelled",
        related_entity_id=session_id,
        related_entity_type="session",
    )

    await db.flush()
    return SuccessResponse(message="Booking cancelled successfully")


@router.post("/book-meeting", response_model=SessionResponse)
async def book_meeting(
    data: BookMeetingRequest,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    from app.core.exceptions import NotFoundError

    tutor = await db.get(Account, data.tutor_id)
    if not tutor or tutor.account_type != "tutor":
        raise NotFoundError(detail="Tutor not found")

    title = data.title or f"Meeting with {tutor.first_name} {tutor.last_name}"
    end_time = data.start_time + timedelta(minutes=data.duration_minutes)
    jitsi_room = f"rihla-{uuid.uuid4().hex[:12]}" if data.mode != "physical" else None

    session = Session(
        tutor_id=data.tutor_id,
        title=title,
        session_type="booking_meeting",
        mode=data.mode,
        status="active",
        duration_minutes=data.duration_minutes,
        start_time=data.start_time,
        end_time=end_time,
        jitsi_room_name=jitsi_room,
    )
    db.add(session)
    await db.flush()

    enrolment = Enrolment(
        session_id=session.id,
        student_id=current_user.id,
        status="active",
    )
    db.add(enrolment)
    await chat_service.get_or_create_dm_room(db, current_user.id, data.tutor_id)
    await db.flush()

    return SessionResponse(
        id=session.id,
        tutor_id=session.tutor_id,
        tutor_name=f"{tutor.first_name} {tutor.last_name}",
        title=session.title,
        session_type=session.session_type,
        mode=session.mode,
        status=session.status,
        location_city=None,
        location_region=None,
        location_country=None,
        duration_minutes=session.duration_minutes,
        start_time=session.start_time,
        end_time=session.end_time,
        max_group_size=None,
        jitsi_room_name=session.jitsi_room_name,
        individual_rate_override=None,
        group_rate_override=None,
        currency_override=None,
        enrolled_count=1,
        is_enrolled=True,
        created_at=session.created_at,
    )
