import uuid

from pydantic import BaseModel


class StudentSubjectRequest(BaseModel):
    subject_id: uuid.UUID
    education_level_id: uuid.UUID


class StudentProfileUpdateRequest(BaseModel):
    education_level_id: uuid.UUID | None = None
    bio: str | None = None
    subjects: list[StudentSubjectRequest] | None = None


class StudentSubjectResponse(BaseModel):
    id: uuid.UUID
    subject_id: uuid.UUID
    subject_name: str | None = None
    education_level_id: uuid.UUID
    education_level_name: str | None = None

    model_config = {"from_attributes": True}


class StudentProfileResponse(BaseModel):
    account_id: uuid.UUID
    education_level_id: uuid.UUID | None
    education_level_name: str | None = None
    bio: str | None
    subjects: list[StudentSubjectResponse] = []

    model_config = {"from_attributes": True}
