from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.admin import AdminDashboardResponse
from app.services import admin_service

router = APIRouter()


@router.get("/dashboard", response_model=AdminDashboardResponse)
async def get_dashboard(
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    stats = await admin_service.get_dashboard_stats(db)
    return AdminDashboardResponse(**stats)
