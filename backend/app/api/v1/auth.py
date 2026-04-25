from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.exceptions import RateLimitError, UnauthorizedError
from app.core.rate_limiter import rate_limit_login, rate_limit_register
from app.core.security import create_access_token, generate_token, hash_token
from app.database import get_db
from app.models.token import RefreshToken
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RecoverEmailRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.config import settings
from app.schemas.account import AccountResponse
from app.schemas.common import SuccessResponse
from app.services import auth_service, email_service

router = APIRouter()


def _get_refresh_token(request: Request, body: dict | None = None) -> str:
    """Extract refresh token from request body or cookie."""
    token = None
    if body and isinstance(body, dict):
        token = body.get("refresh_token")
    if not token:
        token = request.cookies.get("refresh_token")
    if not token:
        raise UnauthorizedError(detail="No refresh token provided")
    return token


@router.post("/register")
async def register(
    data: RegisterRequest, request: Request, response: Response,
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    if not await rate_limit_register(client_ip):
        raise RateLimitError(detail="Too many registration attempts. Try again later.")
    account, verification_token = await auth_service.register(db, data)

    if settings.APP_ENV == "development":
        account.is_email_verified = True
        await db.flush()

    await email_service.send_verification_email(
        account.email, verification_token, db
    )

    if settings.APP_ENV == "development":
        access_token = create_access_token(
            {"sub": str(account.id), "type": "access", "role": account.account_type}
        )
        raw_refresh = generate_token()
        db.add(RefreshToken(
            account_id=account.id,
            token_hash=hash_token(raw_refresh),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        ))
        await db.flush()

        response.set_cookie(
            key="refresh_token", value=raw_refresh, httponly=True,
            secure=True, samesite="lax", max_age=7 * 24 * 3600, path="/api/v1/auth",
        )
        response.set_cookie(
            key="access_token", value=access_token, httponly=True,
            secure=True, samesite="lax", max_age=15 * 60, path="/",
        )
        return {
            "message": "Account created and auto-verified (dev mode).",
            "data": {
                "account_id": str(account.id),
                "access_token": access_token,
                "refresh_token": raw_refresh,
                "account": AccountResponse.model_validate(account).model_dump(mode="json"),
            },
        }
    return SuccessResponse(
        message="Account created. Please check your email to verify.",
        data={"account_id": str(account.id)},
    )


@router.post("/login")
async def login(
    data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    if not await rate_limit_login(data.email):
        raise RateLimitError(detail="Too many login attempts. Try again in 5 minutes.")
    token_response, raw_refresh, account = await auth_service.login(db, data)
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
    return {
        "data": {
            "account": AccountResponse.model_validate(account).model_dump(mode="json"),
            "access_token": token_response.access_token,
            "refresh_token": raw_refresh,
        }
    }


@router.post("/logout", response_model=SuccessResponse)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        body = None
    try:
        raw_refresh = _get_refresh_token(request, body)
        await auth_service.logout(db, raw_refresh)
    except UnauthorizedError:
        pass
    response.delete_cookie("refresh_token", path="/api/v1/auth")
    response.delete_cookie("access_token", path="/")
    return SuccessResponse(message="Logged out successfully")


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        body = None
    raw_refresh = _get_refresh_token(request, body)

    new_access, new_refresh = await auth_service.refresh_access_token(
        db, raw_refresh
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
    return {"data": {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}}


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
