import uuid
from datetime import datetime

from pydantic import BaseModel


class CalendarEventResponse(BaseModel):
    id: uuid.UUID
    title: str
    start: datetime
    end: datetime
    session_type: str
    mode: str
    status: str
    role: str
    tutor_name: str | None = None
    location_city: str | None = None

    model_config = {"from_attributes": True}
