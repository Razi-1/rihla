import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class RecurrenceRequest(BaseModel):
    frequency: str = Field(pattern="^(weekly|biweekly|monthly)$")
    days_of_week: list[int]
    start_date: date
    end_date: date


class SessionCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    session_type: str = Field(
        pattern="^(booking_meeting|individual_class|group_class)$"
    )
    mode: str = Field(pattern="^(online|physical|hybrid)$")
    location_address: str | None = None
    location_city: str | None = None
    location_region: str | None = None
    location_country: str | None = None
    duration_minutes: int = Field(ge=30, le=120)
    start_time: datetime
    max_group_size: int | None = Field(None, ge=2, le=50)
    individual_rate_override: Decimal | None = None
    group_rate_override: Decimal | None = None
    currency_override: str | None = None
    recurrence: RecurrenceRequest | None = None
    student_ids: list[uuid.UUID] | None = None


class SessionUpdateRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    mode: str | None = Field(None, pattern="^(online|physical|hybrid)$")
    location_address: str | None = None
    location_city: str | None = None
    start_time: datetime | None = None
    duration_minutes: int | None = Field(None, ge=30, le=120)
    max_group_size: int | None = Field(None, ge=2, le=50)
    scope: str = Field(default="single", pattern="^(single|all_future)$")


class SessionResponse(BaseModel):
    id: uuid.UUID
    tutor_id: uuid.UUID
    tutor_name: str | None = None
    title: str
    session_type: str
    mode: str
    status: str
    location_city: str | None
    location_region: str | None
    location_country: str | None
    location_address: str | None = None
    duration_minutes: int
    start_time: datetime
    end_time: datetime
    max_group_size: int | None
    jitsi_room_name: str | None
    individual_rate_override: Decimal | None
    group_rate_override: Decimal | None
    currency_override: str | None
    enrolled_count: int = 0
    is_recurring: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
