import uuid
from datetime import datetime

from pydantic import BaseModel


class GenerateQRRequest(BaseModel):
    session_id: uuid.UUID


class ValidateQRRequest(BaseModel):
    qr_token: str
    session_id: uuid.UUID


class AttendanceResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    student_id: uuid.UUID
    student_name: str | None = None
    method: str
    recorded_at: datetime

    model_config = {"from_attributes": True}


class QRTokenResponse(BaseModel):
    qr_image_base64: str
    valid_until: datetime
