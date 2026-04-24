from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.exceptions import RateLimitError
from app.core.rate_limiter import rate_limit_login, rate_limit_register
from app.database import get_db
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RecoverEmailRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.common import SuccessResponse
from app.services import auth_service, email_service

router = APIRouter()


@router.post("/register", response_model=SuccessResponse)
async def register(
    data: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    if not await rate_limit_register(client_ip):
        raise RateLimitError(detail="Too many registration attempts. Try again later.")
    account, verification_token = await auth_service.register(db, data)
    await email_service.send_verification_email(
        account.email, verification_token, db
    )
    return SuccessResponse(
        message="Account created. Please check your email to verify.",
        data={"account_id": str(account.id)},
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    if not await rate_limit_login(data.email):
        raise RateLimitError(detail="Too many login attempts. Try again in 5 minutes.")
    token_response, raw_refresh = await auth_service.login(db, data)
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/api/v1/auth",
    )
    response.set_cookie(
        key="access_token",
        value=token_response.access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=15 * 60,
        path="/",
    )
    return token_response


@router.post("/logout", response_model=SuccessResponse)
async def logout(
    data: RefreshRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    await auth_service.logout(db, data.refresh_token)
    response.delete_cookie("refresh_token", path="/api/v1/auth")
    response.delete_cookie("access_token", path="/")
    return SuccessResponse(message="Logged out successfully")


@router.post("/refresh")
async def refresh(
    data: RefreshRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    new_access, new_refresh = await auth_service.refresh_access_token(
        db, data.refresh_token
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/api/v1/auth",
    )
    response.set_cookie(
        key="access_token",
        value=new_access,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=15 * 60,
        path="/",
    )
    return {"access_token": new_access, "token_type": "bearer"}


@router.post("/verify-email", response_model=SuccessResponse)
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.verify_email(db, data.token)
    return SuccessResponse(message="Email verified successfully")


@router.post("/resend-verification", response_model=SuccessResponse)
async def resend_verification(
    current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    token = await auth_service.resend_verification(db, current_user)
    await email_service.send_verification_email(current_user.email, token, db)
    return SuccessResponse(message="Verification email sent")


@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(
    data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
):
    token = await auth_service.forgot_password(db, data.email, data.account_type)
    if token:
        await email_service.send_password_reset_email(data.email, token, db)
    return SuccessResponse(message="If an account exists, a reset link has been sent")


@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(
    data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
):
    await auth_service.reset_password(db, data.token, data.new_password)
    return SuccessResponse(message="Password reset successfully")


@router.post("/recover-email")
async def recover_email(
    data: RecoverEmailRequest, db: AsyncSession = Depends(get_db)
):
    masked = await auth_service.recover_email(
        db, data.government_id, data.password, data.account_type, data.id_country_code
    )
    return {"data": {"masked_email": masked}}
