from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.student import StudentProfileResponse, StudentProfileUpdateRequest
from app.services import student_service

router = APIRouter()


@router.get("/me/profile", response_model=StudentProfileResponse)
async def get_profile(
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    profile = await student_service.get_student_profile(db, current_user.id)
    return StudentProfileResponse.model_validate(profile)


@router.put("/me/profile", response_model=StudentProfileResponse)
async def update_profile(
    data: StudentProfileUpdateRequest,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    profile = await student_service.update_student_profile(
        db, current_user.id, data
    )
    return StudentProfileResponse.model_validate(profile)
