from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.database import get_db
from app.services import calendar_service

router = APIRouter()


@router.get("/events")
async def get_events(
    start: datetime,
    end: datetime,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    events = await calendar_service.get_calendar_events(
        db, current_user, start, end
    )
    return {"data": events}
