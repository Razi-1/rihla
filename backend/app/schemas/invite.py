import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class InviteResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    student_id: uuid.UUID
    status: str
    session_title: str | None = None
    session_type: str | None = None
    session_mode: str | None = None
    start_time: datetime | None = None
    duration_minutes: int | None = None
    tutor_name: str | None = None
    location_city: str | None = None
    conflict_details: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteActionRequest(BaseModel):
    note: str | None = Field(None, max_length=500)
