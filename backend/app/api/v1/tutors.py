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


@router.get("/{tutor_id}")
async def get_public_profile(
    tutor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    profile = await tutor_service.get_tutor_profile(db, tutor_id)
    stats = await tutor_service.get_tutor_stats(db, tutor_id)
    return {
        "data": {
            "account_id": str(tutor_id),
            "bio": profile.bio,
            "mode_of_tuition": profile.mode_of_tuition,
            "is_profile_complete": profile.is_profile_complete,
            "average_rating": stats["average_rating"],
            "review_count": stats["review_count"],
            "sentiment_summary": stats["sentiment_summary"],
        }
    }


@router.get("/{tutor_id}/authenticated")
async def get_auth_profile(
    tutor_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    profile = await tutor_service.get_tutor_profile(db, tutor_id)
    stats = await tutor_service.get_tutor_stats(db, tutor_id)
    return {
        "data": {
            "account_id": str(tutor_id),
            "bio": profile.bio,
            "mode_of_tuition": profile.mode_of_tuition,
            "individual_rate": str(profile.individual_rate) if profile.individual_rate else None,
            "group_rate": str(profile.group_rate) if profile.group_rate else None,
            "currency": profile.currency,
            "average_rating": stats["average_rating"],
            "review_count": stats["review_count"],
            "sentiment_summary": stats["sentiment_summary"],
        }
    }
