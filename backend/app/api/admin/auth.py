from fastapi import APIRouter, Cookie, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel, Field

from app.core.auth import require_role
from app.core.exceptions import RateLimitError, ValidationError
from app.core.rate_limiter import rate_limit_login
from app.database import get_db
from app.models.account import Account
from app.schemas.admin import AdminLoginRequest
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.common import SuccessResponse
from app.services import auth_service


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def admin_login(
    data: AdminLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    if not await rate_limit_login(data.email):
        raise RateLimitError(detail="Too many login attempts. Try again in 5 minutes.")
    login_data = LoginRequest(
        email=data.email, password=data.password, account_type="admin"
    )
    token_response, raw_refresh, _account = await auth_service.login(db, login_data)
    response.set_cookie(
        key="admin_refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/api/admin",
    )
    return token_response


@router.put("/password", response_model=SuccessResponse)
async def change_password(
    data: PasswordChangeRequest,
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from app.core.security import verify_password, hash_password

    if not verify_password(data.current_password, current_user.password_hash):
        raise ValidationError(detail="Current password is incorrect")
    current_user.password_hash = hash_password(data.new_password)
    await db.flush()
    return SuccessResponse(message="Password changed successfully")


@router.post("/refresh", response_model=TokenResponse)
async def admin_refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    refresh_token = request.cookies.get("admin_refresh_token")
    if not refresh_token:
        raise ValidationError(detail="No refresh token found")
    token_response, new_raw_refresh = await auth_service.refresh_token(db, refresh_token)
    response.set_cookie(
        key="admin_refresh_token",
        value=new_raw_refresh,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/api/admin",
    )
    return token_response


@router.post("/logout", response_model=SuccessResponse)
async def admin_logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    refresh_token = request.cookies.get("admin_refresh_token")
    if refresh_token:
        await auth_service.logout(db, refresh_token)
    response.delete_cookie("admin_refresh_token", path="/api/admin")
    return SuccessResponse(message="Admin logged out")
