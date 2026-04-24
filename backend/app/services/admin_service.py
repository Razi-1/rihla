import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.core.security import hash_password
from app.models.account import Account
from app.models.admin import AdminProfile
from app.models.audit import AdminAuditLog
from app.models.review import Review
from app.models.session import Session

logger = logging.getLogger(__name__)


async def get_dashboard_stats(db: AsyncSession) -> dict:
    students = await db.execute(
        select(func.count()).select_from(Account).where(
            Account.account_type == "student", Account.is_active == True
        )
    )
    tutors = await db.execute(
        select(func.count()).select_from(Account).where(
            Account.account_type == "tutor", Account.is_active == True
        )
    )
    parents = await db.execute(
        select(func.count()).select_from(Account).where(
            Account.account_type == "parent", Account.is_active == True
        )
    )
    sessions = await db.execute(
        select(func.count()).select_from(Session).where(Session.status == "active")
    )
    restricted = await db.execute(
        select(func.count()).select_from(Account).where(
            Account.is_restricted == True, Account.is_active == True
        )
    )

    audit_result = await db.execute(
        select(AdminAuditLog)
        .order_by(AdminAuditLog.created_at.desc())
        .limit(10)
    )

    return {
        "total_students": students.scalar(),
        "total_tutors": tutors.scalar(),
        "total_parents": parents.scalar(),
        "total_sessions": sessions.scalar(),
        "restricted_accounts": restricted.scalar(),
        "recent_audit_entries": [
            {
                "id": str(entry.id),
                "action_type": entry.action_type,
                "reason": entry.reason,
                "created_at": entry.created_at.isoformat(),
            }
            for entry in audit_result.scalars().all()
        ],
    }


async def restrict_account(
    db: AsyncSession,
    account_id: uuid.UUID,
    admin_id: uuid.UUID,
    reason: str,
) -> Account:
    account = await db.get(Account, account_id)
    if not account:
        raise NotFoundError(detail="Account not found")
    if account.account_type == "admin":
        raise ForbiddenError(detail="Cannot restrict admin accounts")

    account.is_restricted = True

    audit = AdminAuditLog(
        admin_id=admin_id,
        action_type="restrict_account",
        target_entity_id=account_id,
        target_entity_type="account",
        reason=reason,
    )
    db.add(audit)
    await db.flush()
    return account


async def unrestrict_account(
    db: AsyncSession,
    account_id: uuid.UUID,
    admin_id: uuid.UUID,
    reason: str,
) -> Account:
    account = await db.get(Account, account_id)
    if not account:
        raise NotFoundError(detail="Account not found")

    account.is_restricted = False

    audit = AdminAuditLog(
        admin_id=admin_id,
        action_type="unrestrict_account",
        target_entity_id=account_id,
        target_entity_type="account",
        reason=reason,
    )
    db.add(audit)
    await db.flush()
    return account


async def admin_delete_account(
    db: AsyncSession,
    account_id: uuid.UUID,
    admin_id: uuid.UUID,
    reason: str,
) -> None:
    account = await db.get(Account, account_id)
    if not account:
        raise NotFoundError(detail="Account not found")

    account.is_active = False

    audit = AdminAuditLog(
        admin_id=admin_id,
        action_type="delete_account",
        target_entity_id=account_id,
        target_entity_type="account",
        reason=reason,
    )
    db.add(audit)
    await db.flush()


async def create_admin(
    db: AsyncSession,
    email: str,
    first_name: str,
    last_name: str,
    password: str,
    creating_admin_id: uuid.UUID | None = None,
) -> Account:
    existing = await db.execute(
        select(Account).where(
            Account.email == email, Account.account_type == "admin"
        )
    )
    if existing.scalar_one_or_none():
        raise ValidationError(detail="Admin with this email already exists")

    from app.core.security import compute_hmac, encrypt_data

    account = Account(
        email=email,
        account_type="admin",
        password_hash=hash_password(password),
        government_id_encrypted=encrypt_data("ADMIN_NO_ID"),
        government_id_hmac=compute_hmac(f"ADMIN_{email}"),
        id_country_code="XX",
        first_name=first_name,
        last_name=last_name,
        date_of_birth=datetime(1990, 1, 1).date(),
        is_email_verified=True,
    )
    db.add(account)
    await db.flush()

    admin_profile = AdminProfile(account_id=account.id)
    db.add(admin_profile)

    if creating_admin_id:
        audit = AdminAuditLog(
            admin_id=creating_admin_id,
            action_type="create_admin",
            target_entity_id=account.id,
            target_entity_type="account",
            reason=f"Created admin account for {email}",
        )
        db.add(audit)

    await db.flush()
    return account


async def get_audit_log(
    db: AsyncSession,
    cursor: str | None = None,
    limit: int = 50,
    action_type: str | None = None,
) -> list[AdminAuditLog]:
    query = select(AdminAuditLog)

    if action_type:
        query = query.where(AdminAuditLog.action_type == action_type)
    if cursor:
        query = query.where(
            AdminAuditLog.created_at < datetime.fromisoformat(cursor)
        )

    query = query.order_by(AdminAuditLog.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())
