import uuid
from typing import Annotated

from fastapi import Cookie, Depends, Header, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AccountRestrictedError,
    ForbiddenError,
    UnauthorizedError,
)
from app.core.security import decode_access_token
from app.database import get_db
from app.models.account import Account


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    authorization: str | None = Header(None),
    access_token: str | None = Cookie(None),
) -> Account:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif access_token:
        token = access_token

    if not token:
        raise UnauthorizedError()

    payload = decode_access_token(token)
    if payload is None:
        raise UnauthorizedError(detail="Invalid or expired token")

    account_id = payload.get("sub")
    if not account_id:
        raise UnauthorizedError()

    result = await db.execute(
        select(Account).where(
            Account.id == uuid.UUID(account_id),
            Account.is_active == True,
        )
    )
    account = result.scalar_one_or_none()
    if account is None:
        raise UnauthorizedError(detail="Account not found or deactivated")

    return account


async def get_current_active_user(
    current_user: Account = Depends(get_current_user),
) -> Account:
    if current_user.is_restricted:
        raise AccountRestrictedError()
    return current_user


def require_role(*roles: str):
    async def role_checker(
        current_user: Account = Depends(get_current_user),
    ) -> Account:
        if current_user.account_type not in roles:
            raise ForbiddenError(detail="Insufficient permissions for this action")
        return current_user

    return role_checker


def require_verified_email():
    async def email_checker(
        current_user: Account = Depends(get_current_user),
    ) -> Account:
        if not current_user.is_email_verified:
            from app.core.exceptions import EmailNotVerifiedError

            raise EmailNotVerifiedError()
        return current_user

    return email_checker


CurrentUser = Annotated[Account, Depends(get_current_user)]
ActiveUser = Annotated[Account, Depends(get_current_active_user)]
