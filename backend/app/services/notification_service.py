import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.notification import Notification

logger = logging.getLogger(__name__)


async def create_notification(
    db: AsyncSession,
    account_id: uuid.UUID,
    title: str,
    body: str | None,
    notification_type: str,
    related_entity_id: uuid.UUID | None = None,
    related_entity_type: str | None = None,
) -> Notification:
    notification = Notification(
        account_id=account_id,
        title=title,
        body=body,
        notification_type=notification_type,
        related_entity_id=related_entity_id,
        related_entity_type=related_entity_type,
    )
    db.add(notification)
    await db.flush()
    return notification


async def get_notifications(
    db: AsyncSession,
    account_id: uuid.UUID,
    cursor: str | None = None,
    limit: int = 20,
) -> list[Notification]:
    query = select(Notification).where(Notification.account_id == account_id)

    if cursor:
        query = query.where(
            Notification.created_at < datetime.fromisoformat(cursor)
        )

    query = query.order_by(Notification.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def mark_read(
    db: AsyncSession, notification_id: uuid.UUID, account_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.account_id == account_id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise NotFoundError(detail="Notification not found")

    notification.is_read = True
    await db.flush()


async def mark_all_read(db: AsyncSession, account_id: uuid.UUID) -> int:
    result = await db.execute(
        update(Notification)
        .where(
            Notification.account_id == account_id,
            Notification.is_read == False,
        )
        .values(is_read=True)
    )
    await db.flush()
    return result.rowcount
