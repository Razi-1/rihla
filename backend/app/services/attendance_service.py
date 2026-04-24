import base64
import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.core.security import create_access_token, generate_token, hash_token
from app.models.attendance import AttendanceRecord, QRToken
from app.models.enrolment import Enrolment
from app.models.session import Session
from app.utils.qr_generator import generate_qr_image

logger = logging.getLogger(__name__)


async def generate_qr(
    db: AsyncSession, session_id: uuid.UUID, tutor_id: uuid.UUID
) -> tuple[bytes, datetime]:
    """Generate QR code for attendance. Returns (qr_image_bytes, valid_until)."""
    session = await db.get(Session, session_id)
    if not session:
        raise NotFoundError(detail="Session not found")
    if session.tutor_id != tutor_id:
        raise ForbiddenError(detail="Not your session")

    raw_token = generate_token()
    now = datetime.now(timezone.utc)
    valid_until = now + timedelta(minutes=10)

    qr_record = QRToken(
        session_id=session_id,
        token_hash=hash_token(raw_token),
        valid_from=now,
        valid_until=valid_until,
    )
    db.add(qr_record)
    await db.flush()

    qr_data = f"{session_id}:{raw_token}"
    qr_image = generate_qr_image(qr_data)

    return qr_image, valid_until


async def validate_qr(
    db: AsyncSession,
    session_id: uuid.UUID,
    qr_token: str,
    student_id: uuid.UUID,
) -> AttendanceRecord:
    token_hash = hash_token(qr_token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(QRToken).where(
            QRToken.session_id == session_id,
            QRToken.token_hash == token_hash,
            QRToken.valid_from <= now,
            QRToken.valid_until >= now,
        )
    )
    qr = result.scalar_one_or_none()
    if not qr:
        raise ValidationError(detail="Invalid or expired QR code")

    enrolment_result = await db.execute(
        select(Enrolment).where(
            Enrolment.session_id == session_id,
            Enrolment.student_id == student_id,
            Enrolment.status == "active",
        )
    )
    if not enrolment_result.scalar_one_or_none():
        raise ForbiddenError(detail="Not enrolled in this session")

    existing = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.session_id == session_id,
            AttendanceRecord.student_id == student_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ValidationError(detail="Attendance already recorded")

    record = AttendanceRecord(
        session_id=session_id,
        student_id=student_id,
        method="qr_scan",
    )
    db.add(record)
    await db.flush()
    return record


async def record_jitsi_attendance(
    db: AsyncSession,
    session_id: uuid.UUID,
    student_id: uuid.UUID,
) -> AttendanceRecord | None:
    existing = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.session_id == session_id,
            AttendanceRecord.student_id == student_id,
        )
    )
    if existing.scalar_one_or_none():
        return None

    record = AttendanceRecord(
        session_id=session_id,
        student_id=student_id,
        method="jitsi_webhook",
    )
    db.add(record)
    await db.flush()
    return record


async def get_session_attendance(
    db: AsyncSession, session_id: uuid.UUID
) -> list[AttendanceRecord]:
    result = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.session_id == session_id
        )
    )
    return list(result.scalars().all())
