import uuid

from pydantic import BaseModel, EmailStr, Field


class LinkChildRequest(BaseModel):
    student_email: EmailStr


class PermissionToggleRequest(BaseModel):
    status: str = Field(pattern="^(granted|denied)$")


class ChildSummaryResponse(BaseModel):
    student_id: uuid.UUID
    first_name: str
    last_name: str
    profile_picture_url: str | None
    link_status: str

    model_config = {"from_attributes": True}


class ParentDashboardResponse(BaseModel):
    children: list[ChildSummaryResponse] = []
    pending_permissions: int = 0

    model_config = {"from_attributes": True}
