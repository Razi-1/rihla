import uuid
from datetime import time
from decimal import Decimal

from pydantic import BaseModel, Field


class TutorSubjectRequest(BaseModel):
    subject_id: uuid.UUID
    education_level_id: uuid.UUID


class TutorProfileUpdateRequest(BaseModel):
    bio: str | None = None
    mode_of_tuition: str | None = Field(None, pattern="^(online|physical|hybrid)$")
    country_id: uuid.UUID | None = None
    region_id: uuid.UUID | None = None
    city_id: uuid.UUID | None = None
    timezone: str | None = None
    subjects: list[TutorSubjectRequest] | None = None


class PricingUpdateRequest(BaseModel):
    individual_rate: Decimal | None = None
    group_rate: Decimal | None = None
    currency: str | None = Field(None, min_length=3, max_length=3)


class WorkingHoursSlot(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    is_working: bool = True


class WorkingHoursRequest(BaseModel):
    timezone: str
    slots: list[WorkingHoursSlot]


class TutorSubjectResponse(BaseModel):
    id: uuid.UUID
    subject_id: uuid.UUID
    subject_name: str | None = None
    category_name: str | None = None
    education_level_id: uuid.UUID
    education_level_name: str | None = None

    model_config = {"from_attributes": True}


class WorkingHoursResponse(BaseModel):
    day_of_week: int
    start_time: time
    end_time: time
    is_working: bool
    timezone: str

    model_config = {"from_attributes": True}


class TutorProfileResponse(BaseModel):
    account_id: uuid.UUID
    first_name: str
    last_name: str
    profile_picture_url: str | None
    bio: str | None
    mode_of_tuition: str | None
    country_name: str | None = None
    region_name: str | None = None
    city_name: str | None = None
    individual_rate: Decimal | None
    group_rate: Decimal | None
    currency: str | None
    is_profile_complete: bool
    timezone: str | None
    subjects: list[TutorSubjectResponse] = []
    working_hours: list[WorkingHoursResponse] = []
    average_rating: float | None = None
    review_count: int = 0
    sentiment_summary: str | None = None

    model_config = {"from_attributes": True}


class TutorCardResponse(BaseModel):
    account_id: uuid.UUID
    first_name: str
    last_name: str
    profile_picture_url: str | None
    bio: str | None
    mode_of_tuition: str | None
    city_name: str | None = None
    individual_rate: Decimal | None
    group_rate: Decimal | None
    currency: str | None
    subjects: list[TutorSubjectResponse] = []
    average_rating: float | None = None
    review_count: int = 0

    model_config = {"from_attributes": True}
