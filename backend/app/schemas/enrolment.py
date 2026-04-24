import uuid
from datetime import datetime

from pydantic import BaseModel


class EnrolmentResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    student_id: uuid.UUID
    status: str
    enrolled_at: datetime
    opted_out_at: datetime | None
    session_title: str | None = None
    tutor_name: str | None = None

    model_config = {"from_attributes": True}
