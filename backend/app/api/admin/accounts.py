import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.admin import AdminAccountResponse, RestrictAccountRequest
from app.schemas.common import SuccessResponse
from app.services import admin_service

router = APIRouter()


@router.get("", response_model=list[AdminAccountResponse])
async def list_accounts(
    account_type: str | None = Query(None),
    is_restricted: bool | None = Query(None),
    limit: int = Query(25, ge=1, le=100),
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    query = select(Account).where(Account.is_active == True)
    if account_type:
        query = query.where(Account.account_type == account_type)
    if is_restricted is not None:
        query = query.where(Account.is_restricted == is_restricted)
    query = query.order_by(Account.created_at.desc()).limit(limit)

    result = await db.execute(query)
    accounts = result.scalars().all()
    return [AdminAccountResponse.model_validate(a) for a in accounts]


@router.get("/{account_id}", response_model=AdminAccountResponse)
async def get_account(
    account_id: uuid.UUID,
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    account = await db.get(Account, account_id)
    if not account:
        from app.core.exceptions import NotFoundError

        raise NotFoundError(detail="Account not found")
    return AdminAccountResponse.model_validate(account)


@router.post("/{account_id}/restrict", response_model=SuccessResponse)
async def restrict_account(
    account_id: uuid.UUID,
    data: RestrictAccountRequest,
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await admin_service.restrict_account(
        db, account_id, current_user.id, data.reason
    )
    return SuccessResponse(message="Account restricted")


@router.post("/{account_id}/unrestrict", response_model=SuccessResponse)
async def unrestrict_account(
    account_id: uuid.UUID,
    data: RestrictAccountRequest,
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await admin_service.unrestrict_account(
        db, account_id, current_user.id, data.reason
    )
    return SuccessResponse(message="Account unrestricted")


@router.delete("/{account_id}", response_model=SuccessResponse)
async def delete_account(
    account_id: uuid.UUID,
    data: RestrictAccountRequest,
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await admin_service.admin_delete_account(
        db, account_id, current_user.id, data.reason
    )
    return SuccessResponse(message="Account deleted")
