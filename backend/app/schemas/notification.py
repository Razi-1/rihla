import uuid
from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    body: str | None
    notification_type: str
    related_entity_id: uuid.UUID | None
    related_entity_type: str | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
