import base64
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.attendance import (
    AttendanceResponse,
    GenerateQRRequest,
    QRTokenResponse,
    ValidateQRRequest,
)
from app.services import attendance_service

router = APIRouter()


@router.post("/generate-qr", response_model=QRTokenResponse)
async def generate_qr(
    data: GenerateQRRequest,
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    qr_bytes, valid_until = await attendance_service.generate_qr(
        db, data.session_id, current_user.id
    )
    return QRTokenResponse(
        qr_image_base64=base64.b64encode(qr_bytes).decode(),
        valid_until=valid_until,
    )


@router.post("/validate-qr", response_model=AttendanceResponse)
async def validate_qr(
    data: ValidateQRRequest,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    record = await attendance_service.validate_qr(
        db, data.session_id, data.qr_token, current_user.id
    )
    return AttendanceResponse.model_validate(record)


@router.post("/jitsi-webhook")
async def jitsi_webhook(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    session_id = payload.get("session_id")
    student_id = payload.get("student_id")
    if session_id and student_id:
        await attendance_service.record_jitsi_attendance(
            db, uuid.UUID(session_id), uuid.UUID(student_id)
        )
    return {"status": "ok"}


@router.get("/session/{session_id}", response_model=list[AttendanceResponse])
async def get_session_attendance(
    session_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    records = await attendance_service.get_session_attendance(db, session_id)
    return [AttendanceResponse.model_validate(r) for r in records]
