from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.admin import AdminAccountResponse, CreateAdminRequest
from app.schemas.common import SuccessResponse
from app.services import admin_service

router = APIRouter()


@router.get("", response_model=list[AdminAccountResponse])
async def list_admins(
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account).where(
            Account.account_type == "admin",
            Account.is_active == True,
        )
    )
    admins = result.scalars().all()
    return [AdminAccountResponse.model_validate(a) for a in admins]


@router.post("/create", response_model=SuccessResponse)
async def create_admin(
    data: CreateAdminRequest,
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    account = await admin_service.create_admin(
        db,
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        password=data.temporary_password,
        creating_admin_id=current_user.id,
    )
    return SuccessResponse(
        message="Admin account created",
        data={"account_id": str(account.id)},
    )
