import uuid
from datetime import date

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    account_type: str = Field(pattern="^(student|tutor|parent)$")
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    date_of_birth: date
    government_id: str = Field(min_length=5, max_length=50)
    id_country_code: str = Field(min_length=2, max_length=3)
    phone_number: str | None = None
    phone_country_code: str | None = None
    gender: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    account_type: str = Field(pattern="^(student|tutor|parent|admin)$")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    account_id: uuid.UUID
    account_type: str
    first_name: str
    last_name: str
    is_email_verified: bool
    is_age_restricted: bool


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    account_type: str = Field(pattern="^(student|tutor|parent|admin)$")


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class VerifyEmailRequest(BaseModel):
    token: str


class RecoverEmailRequest(BaseModel):
    government_id: str
    password: str
    account_type: str = Field(pattern="^(student|tutor|parent)$")
    id_country_code: str = Field(min_length=2, max_length=3)
