import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.common import SuccessResponse
from app.schemas.parent import (
    ChildSummaryResponse,
    LinkChildRequest,
    ParentDashboardResponse,
    PermissionToggleRequest,
)
from app.services import parent_service

router = APIRouter()


@router.get("/me/dashboard", response_model=ParentDashboardResponse)
async def get_dashboard(
    current_user: Account = Depends(require_role("parent")),
    db: AsyncSession = Depends(get_db),
):
    children = await parent_service.get_children(db, current_user.id)
    pending = await parent_service.get_pending_permissions(db, current_user.id)
    upcoming = await parent_service.count_upcoming_sessions(db, current_user.id)
    return ParentDashboardResponse(
        children=[ChildSummaryResponse(**c) for c in children],
        pending_permissions=len(pending),
        upcoming_sessions_total=upcoming,
    )


@router.post("/me/link-child", response_model=SuccessResponse)
async def link_child(
    data: LinkChildRequest,
    current_user: Account = Depends(require_role("parent")),
    db: AsyncSession = Depends(get_db),
):
    await parent_service.link_child(db, current_user.id, data.student_email)
    return SuccessResponse(message="Link request sent to student")


@router.get("/me/children", response_model=list[ChildSummaryResponse])
async def list_children(
    current_user: Account = Depends(require_role("parent")),
    db: AsyncSession = Depends(get_db),
):
    children = await parent_service.get_children(db, current_user.id)
    return [ChildSummaryResponse(**c) for c in children]


@router.get("/me/children/{student_id}")
async def get_child(
    student_id: uuid.UUID,
    current_user: Account = Depends(require_role("parent")),
    db: AsyncSession = Depends(get_db),
):
    child = await parent_service.get_child_detail(db, current_user.id, student_id)
    return {"data": child}


@router.put("/me/permissions/{permission_id}", response_model=SuccessResponse)
async def update_permission(
    permission_id: uuid.UUID,
    data: PermissionToggleRequest,
    current_user: Account = Depends(require_role("parent")),
    db: AsyncSession = Depends(get_db),
):
    await parent_service.update_permission(
        db, permission_id, current_user.id, data.status
    )
    return SuccessResponse(message=f"Permission {data.status}")
