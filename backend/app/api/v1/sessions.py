import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.common import SuccessResponse
from app.schemas.session import SessionCreateRequest, SessionResponse, SessionUpdateRequest
from app.services import session_service

router = APIRouter()


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
        created_at=session.created_at,
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    session = await session_service.get_session(db, session_id)
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
        enrolled_count=len(session.enrolments),
        is_recurring=session.recurrence_rule is not None,
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
