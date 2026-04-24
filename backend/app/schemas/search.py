import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class SearchFilters(BaseModel):
    subject_id: uuid.UUID | None = None
    education_level_id: uuid.UUID | None = None
    mode: str | None = Field(None, pattern="^(online|physical|hybrid)$")
    city_id: uuid.UUID | None = None
    region_id: uuid.UUID | None = None
    country_id: uuid.UUID | None = None
    min_rating: float | None = Field(None, ge=1, le=5)
    max_rate: Decimal | None = None
    gender: str | None = None
    cursor: str | None = None
    limit: int = Field(default=20, ge=1, le=50)


class AISearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=500)
    cursor: str | None = None
    limit: int = Field(default=20, ge=1, le=50)


class SearchResultResponse(BaseModel):
    tutors: list[dict]
    next_cursor: str | None = None
    has_more: bool = False
    ai_interpretation: dict | None = None
