import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.core.security import generate_token, hash_token
from app.models.account import Account
from app.models.parent import (
    ParentInviteToken,
    ParentProfile,
    ParentStudentLink,
    ParentTutorPermission,
)

logger = logging.getLogger(__name__)


async def link_child(
    db: AsyncSession, parent_id: uuid.UUID, student_email: str
) -> ParentStudentLink:
    result = await db.execute(
        select(Account).where(
            Account.email == student_email,
            Account.account_type == "student",
            Account.is_active == True,
        )
    )
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError(detail="No student account found with that email")

    existing = await db.execute(
        select(ParentStudentLink).where(
            ParentStudentLink.parent_id == parent_id,
            ParentStudentLink.student_id == student.id,
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError(detail="Already linked to this student")

    link = ParentStudentLink(
        parent_id=parent_id,
        student_id=student.id,
        status="pending",
    )
    db.add(link)

    raw_token = generate_token()
    invite = ParentInviteToken(
        student_id=student.id,
        parent_email="",
        token_hash=hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invite)
    await db.flush()

    logger.info("Parent %s linked to student %s", parent_id, student.id)
    return link


async def confirm_link(
    db: AsyncSession, student_id: uuid.UUID, parent_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(ParentStudentLink).where(
            ParentStudentLink.parent_id == parent_id,
            ParentStudentLink.student_id == student_id,
            ParentStudentLink.status == "pending",
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        raise NotFoundError(detail="No pending link request found")

    link.status = "active"
    await db.flush()


async def get_children(
    db: AsyncSession, parent_id: uuid.UUID
) -> list[dict]:
    result = await db.execute(
        select(ParentStudentLink, Account)
        .join(Account, ParentStudentLink.student_id == Account.id)
        .where(ParentStudentLink.parent_id == parent_id)
    )
    children = []
    for link, account in result.all():
        children.append({
            "student_id": account.id,
            "first_name": account.first_name,
            "last_name": account.last_name,
            "profile_picture_url": account.profile_picture_url,
            "link_status": link.status,
        })
    return children


async def update_permission(
    db: AsyncSession,
    permission_id: uuid.UUID,
    parent_id: uuid.UUID,
    status: str,
) -> ParentTutorPermission:
    result = await db.execute(
        select(ParentTutorPermission).where(
            ParentTutorPermission.id == permission_id,
            ParentTutorPermission.parent_id == parent_id,
        )
    )
    permission = result.scalar_one_or_none()
    if not permission:
        raise NotFoundError(detail="Permission not found")

    permission.status = status
    await db.flush()
    return permission


async def get_pending_permissions(
    db: AsyncSession, parent_id: uuid.UUID
) -> list[ParentTutorPermission]:
    result = await db.execute(
        select(ParentTutorPermission).where(
            ParentTutorPermission.parent_id == parent_id,
            ParentTutorPermission.status == "pending",
        )
    )
    return list(result.scalars().all())
