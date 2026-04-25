import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field


class AccountResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    account_type: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str | None
    phone_number: str | None
    phone_country_code: str | None
    profile_picture_url: str | None
    is_active: bool
    is_restricted: bool
    is_email_verified: bool
    is_age_restricted: bool
    deletion_requested_at: datetime | None
    deletion_scheduled_for: datetime | None
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AccountUpdateRequest(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    phone_number: str | None = None
    phone_country_code: str | None = None
    profile_picture_url: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class SettingsResponse(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    timezone: str = "UTC"


class SettingsUpdateRequest(BaseModel):
    email_notifications: bool | None = None
    push_notifications: bool | None = None
    timezone: str | None = None
