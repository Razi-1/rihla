import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
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


async def get_child_detail(
    db: AsyncSession, parent_id: uuid.UUID, student_id: uuid.UUID
) -> dict:
    result = await db.execute(
        select(ParentStudentLink, Account)
        .join(Account, ParentStudentLink.student_id == Account.id)
        .where(
            ParentStudentLink.parent_id == parent_id,
            ParentStudentLink.student_id == student_id,
        )
    )
    row = result.one_or_none()
    if not row:
        raise NotFoundError(detail="Child not found or not linked")
    link, account = row

    from app.models.enrolment import Enrolment
    from app.models.session import Session

    enrolment_result = await db.execute(
        select(Session)
        .join(Enrolment, Enrolment.session_id == Session.id)
        .where(
            Enrolment.student_id == student_id,
            Enrolment.status == "active",
        )
    )
    sessions = enrolment_result.scalars().all()

    permission_result = await db.execute(
        select(ParentTutorPermission).where(
            ParentTutorPermission.parent_id == parent_id,
            ParentTutorPermission.student_id == student_id,
        )
    )
    permissions = permission_result.scalars().all()

    return {
        "student_id": account.id,
        "first_name": account.first_name,
        "last_name": account.last_name,
        "email": account.email,
        "profile_picture_url": account.profile_picture_url,
        "link_status": link.status,
        "classes": [
            {
                "id": str(s.id),
                "title": s.title,
                "session_type": s.session_type,
                "start_time": s.start_time.isoformat() if s.start_time else None,
            }
            for s in sessions
        ],
        "permissions": [
            {
                "id": str(p.id),
                "tutor_id": str(p.tutor_id),
                "permission_type": p.permission_type,
                "status": p.status,
            }
            for p in permissions
        ],
    }


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


async def count_upcoming_sessions(
    db: AsyncSession, parent_id: uuid.UUID
) -> int:
    """Count upcoming sessions across all actively linked children."""
    from app.models.enrolment import Enrolment
    from app.models.session import Session

    result = await db.execute(
        select(ParentStudentLink.student_id).where(
            ParentStudentLink.parent_id == parent_id,
            ParentStudentLink.status == "active",
        )
    )
    student_ids = [row[0] for row in result.all()]

    if not student_ids:
        return 0

    count_result = await db.execute(
        select(func.count(Session.id))
        .join(Enrolment, Enrolment.session_id == Session.id)
        .where(
            Enrolment.student_id.in_(student_ids),
            Enrolment.status == "active",
            Session.start_time > datetime.now(timezone.utc),
        )
    )
    return count_result.scalar() or 0
