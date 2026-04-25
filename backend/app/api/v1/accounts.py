from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.database import get_db
from app.schemas.account import (
    AccountResponse,
    AccountUpdateRequest,
    ChangePasswordRequest,
    SettingsResponse,
    SettingsUpdateRequest,
)
from app.schemas.common import SuccessResponse
from app.services import account_service

router = APIRouter()


@router.get("/me")
async def get_me(current_user: CurrentUser):
    return {"data": AccountResponse.model_validate(current_user).model_dump(mode="json")}


@router.put("/me")
async def update_me(
    data: AccountUpdateRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    updated = await account_service.update_account(db, current_user, data)
    return {"data": AccountResponse.model_validate(updated).model_dump(mode="json")}


@router.put("/me/password", response_model=SuccessResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await account_service.change_password(db, current_user, data)
    return SuccessResponse(message="Password changed successfully")


@router.delete("/me", response_model=SuccessResponse)
async def request_deletion(
    current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    await account_service.request_deletion(db, current_user)
    return SuccessResponse(message="Account deletion scheduled in 7 days")


@router.post("/me/cancel-deletion", response_model=SuccessResponse)
async def cancel_deletion(
    current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    await account_service.cancel_deletion(db, current_user)
    return SuccessResponse(message="Deletion cancelled")


@router.get("/me/settings", response_model=SettingsResponse)
async def get_settings(current_user: CurrentUser):
    return SettingsResponse()


@router.put("/me/settings", response_model=SuccessResponse)
async def update_settings(
    data: SettingsUpdateRequest, current_user: CurrentUser
):
    return SuccessResponse(message="Settings updated")
