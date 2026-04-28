import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.tutor import (
    PricingUpdateRequest,
    TutorProfileResponse,
    TutorProfileUpdateRequest,
    WorkingHoursRequest,
)
from app.services import tutor_service

router = APIRouter()


@router.get("/me/dashboard")
async def get_dashboard(
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    from app.services import tutor_service as ts
    dashboard = await ts.get_tutor_dashboard(db, current_user.id)
    return {"data": dashboard}


@router.get("/me/preview")
async def get_preview(
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    profile = await tutor_service.get_tutor_profile(db, current_user.id)
    stats = await tutor_service.get_tutor_stats(db, current_user.id)
    return {"data": tutor_service.serialize_tutor_profile(profile, stats)}


@router.get("/me/profile", response_model=TutorProfileResponse)
async def get_my_profile(
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    profile = await tutor_service.get_tutor_profile(db, current_user.id)
    stats = await tutor_service.get_tutor_stats(db, current_user.id)
    resp = TutorProfileResponse(
        account_id=current_user.id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        profile_picture_url=current_user.profile_picture_url,
        bio=profile.bio,
        mode_of_tuition=profile.mode_of_tuition,
        individual_rate=profile.individual_rate,
        group_rate=profile.group_rate,
        currency=profile.currency,
        is_profile_complete=profile.is_profile_complete,
        timezone=profile.timezone,
        average_rating=stats["average_rating"],
        review_count=stats["review_count"],
        sentiment_summary=stats["sentiment_summary"],
    )
    return resp


@router.put("/me/profile", response_model=TutorProfileResponse)
async def update_profile(
    data: TutorProfileUpdateRequest,
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    profile = await tutor_service.update_tutor_profile(
        db, current_user.id, data
    )
    return TutorProfileResponse(
        account_id=current_user.id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        profile_picture_url=current_user.profile_picture_url,
        bio=profile.bio,
        mode_of_tuition=profile.mode_of_tuition,
        individual_rate=profile.individual_rate,
        group_rate=profile.group_rate,
        currency=profile.currency,
        is_profile_complete=profile.is_profile_complete,
        timezone=profile.timezone,
    )


@router.put("/me/pricing")
async def update_pricing(
    data: PricingUpdateRequest,
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    await tutor_service.update_pricing(db, current_user.id, data)
    return {"message": "Pricing updated"}


@router.put("/me/working-hours")
async def update_working_hours(
    data: WorkingHoursRequest,
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    await tutor_service.update_working_hours(db, current_user.id, data)
    return {"message": "Working hours updated"}


@router.get("/me/classes")
async def get_my_classes(
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.session import Session

    result = await db.execute(
        select(Session)
        .options(selectinload(Session.enrolments))
        .where(Session.tutor_id == current_user.id)
        .order_by(Session.start_time.desc())
    )
    sessions = result.scalars().all()
    return {
        "data": [
            {
                "id": str(s.id),
                "tutor_id": str(s.tutor_id),
                "tutor_name": f"{current_user.first_name} {current_user.last_name}",
                "title": s.title,
                "session_type": s.session_type,
                "mode": s.mode,
                "status": s.status,
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat(),
                "duration_minutes": s.duration_minutes,
                "max_group_size": s.max_group_size,
                "jitsi_room_name": s.jitsi_room_name,
                "enrolled_count": len(s.enrolments) if s.enrolments else 0,
                "subject_name": s.subject.name if s.subject else None,
                "education_level_name": s.education_level.name if s.education_level else None,
            }
            for s in sessions
        ],
        "next_cursor": None,
        "has_more": False,
    }


@router.get("/{tutor_id}")
async def get_public_profile(
    tutor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    profile = await tutor_service.get_tutor_profile(db, tutor_id)
    stats = await tutor_service.get_tutor_stats(db, tutor_id)
    return {"data": tutor_service.serialize_tutor_profile(profile, stats)}


@router.get("/{tutor_id}/authenticated")
async def get_auth_profile(
    tutor_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    profile = await tutor_service.get_tutor_profile(db, tutor_id)
    stats = await tutor_service.get_tutor_stats(db, tutor_id)
    return {"data": tutor_service.serialize_tutor_profile(profile, stats)}


@router.get("/{tutor_id}/classes")
async def get_tutor_classes(
    tutor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.session import Session

    result = await db.execute(
        select(Session)
        .options(selectinload(Session.enrolments))
        .where(
            Session.tutor_id == tutor_id,
            Session.session_type == "group_class",
            Session.status == "active",
        ).order_by(Session.start_time.asc())
    )
    sessions = result.scalars().all()
    return {
        "data": [
            {
                "id": str(s.id),
                "tutor_id": str(s.tutor_id),
                "title": s.title,
                "session_type": s.session_type,
                "mode": s.mode,
                "status": s.status,
                "location_city": s.location_city,
                "duration_minutes": s.duration_minutes,
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat(),
                "max_group_size": s.max_group_size,
                "jitsi_room_name": s.jitsi_room_name,
                "enrolled_count": len(s.enrolments) if s.enrolments else 0,
                "subject_name": s.subject.name if s.subject else None,
                "education_level_name": s.education_level.name if s.education_level else None,
            }
            for s in sessions
        ]
    }
