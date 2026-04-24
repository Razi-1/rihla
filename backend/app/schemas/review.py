import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreateRequest(BaseModel):
    tutor_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=10, max_length=5000)
    sessions_attended: int = Field(ge=1)
    approximate_duration_weeks: int = Field(ge=1)


class ReviewUpdateRequest(BaseModel):
    rating: int | None = Field(None, ge=1, le=5)
    text: str | None = Field(None, min_length=10, max_length=5000)


class ReviewResponse(BaseModel):
    id: uuid.UUID
    tutor_id: uuid.UUID
    rating: int
    text: str
    reviewer_first_name: str | None = None
    reviewer_last_name: str | None = None
    sessions_attended: int | None = None
    approximate_duration_weeks: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
