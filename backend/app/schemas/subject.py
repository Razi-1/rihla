import uuid

from pydantic import BaseModel, Field


class SubjectCategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    display_order: int
    subjects: list["SubjectResponse"] = []

    model_config = {"from_attributes": True}


class SubjectResponse(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    name: str
    display_order: int
    available_levels: list["EducationLevelResponse"] = Field(
        default=[], validation_alias="level_availability"
    )

    model_config = {"from_attributes": True}


class EducationLevelResponse(BaseModel):
    id: uuid.UUID
    name: str
    display_order: int
    min_age: int | None
    max_age: int | None

    model_config = {"from_attributes": True}


class SubjectCategoryCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    display_order: int = 0


class SubjectCreateRequest(BaseModel):
    category_id: uuid.UUID
    name: str = Field(min_length=1, max_length=100)
    display_order: int = 0
    education_level_ids: list[uuid.UUID] = []


class SubjectUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    display_order: int | None = None
    education_level_ids: list[uuid.UUID] | None = None
