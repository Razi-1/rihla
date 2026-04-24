import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.database import get_db
from app.schemas.common import SuccessResponse
from app.schemas.notification import NotificationResponse
from app.services import notification_service

router = APIRouter()


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    current_user: CurrentUser,
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    notifications = await notification_service.get_notifications(
        db, current_user.id, cursor, limit
    )
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.put("/mark-all-read", response_model=SuccessResponse)
async def mark_all_read(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    count = await notification_service.mark_all_read(db, current_user.id)
    return SuccessResponse(message=f"{count} notifications marked as read")


@router.put("/{notification_id}/read", response_model=SuccessResponse)
async def mark_read(
    notification_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await notification_service.mark_read(db, notification_id, current_user.id)
    return SuccessResponse(message="Notification marked as read")
