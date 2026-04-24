import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.common import SuccessResponse
from app.schemas.enrolment import EnrolmentResponse
from app.services import enrolment_service

router = APIRouter()


@router.get("", response_model=list[EnrolmentResponse])
async def list_enrolments(
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    enrolments = await enrolment_service.get_student_enrolments(
        db, current_user.id
    )
    return [EnrolmentResponse.model_validate(e) for e in enrolments]


@router.post("/{enrolment_id}/opt-out", response_model=SuccessResponse)
async def opt_out(
    enrolment_id: uuid.UUID,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    await enrolment_service.opt_out(db, enrolment_id, current_user.id)
    return SuccessResponse(message="Opted out successfully")
