import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class RestrictAccountRequest(BaseModel):
    reason: str = Field(min_length=10, max_length=1000)


class CreateAdminRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    temporary_password: str = Field(min_length=8, max_length=128)


class AdminDashboardResponse(BaseModel):
    total_students: int = 0
    total_tutors: int = 0
    total_parents: int = 0
    total_sessions: int = 0
    pending_reviews: int = 0
    restricted_accounts: int = 0
    recent_audit_entries: list[dict] = []


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    admin_id: uuid.UUID
    admin_name: str | None = None
    action_type: str
    target_entity_id: uuid.UUID | None
    target_entity_type: str | None
    reason: str
    outcome: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminAccountResponse(BaseModel):
    id: uuid.UUID
    email: str
    account_type: str
    first_name: str
    last_name: str
    is_active: bool
    is_restricted: bool
    is_email_verified: bool
    created_at: datetime
    last_login_at: datetime | None

    model_config = {"from_attributes": True}
