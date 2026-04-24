from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.admin import AdminLoginRequest
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.common import SuccessResponse
from app.services import auth_service

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def admin_login(
    data: AdminLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    login_data = LoginRequest(
        email=data.email, password=data.password, account_type="admin"
    )
    token_response, raw_refresh = await auth_service.login(db, login_data)
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


@router.post("/logout", response_model=SuccessResponse)
async def admin_logout(
    data: RefreshRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    await auth_service.logout(db, data.refresh_token)
    response.delete_cookie("admin_refresh_token", path="/api/admin")
    return SuccessResponse(message="Admin logged out")
