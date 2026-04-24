import logging
import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.chat import ChatRoomMapping
from app.models.session import Session

logger = logging.getLogger(__name__)


async def get_or_create_dm_room(
    db: AsyncSession, account_id_1: uuid.UUID, account_id_2: uuid.UUID
) -> ChatRoomMapping:
    id_1, id_2 = sorted([account_id_1, account_id_2], key=str)

    result = await db.execute(
        select(ChatRoomMapping).where(
            ChatRoomMapping.room_type == "dm",
            ChatRoomMapping.account_id_1 == id_1,
            ChatRoomMapping.account_id_2 == id_2,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    matrix_room_id = f"!dm_{uuid.uuid4().hex[:16]}:localhost"

    room = ChatRoomMapping(
        matrix_room_id=matrix_room_id,
        room_type="dm",
        account_id_1=id_1,
        account_id_2=id_2,
    )
    db.add(room)
    await db.flush()
    return room


async def create_broadcast_room(
    db: AsyncSession, session_id: uuid.UUID, tutor_id: uuid.UUID
) -> ChatRoomMapping:
    session = await db.get(Session, session_id)
    if not session:
        raise NotFoundError(detail="Session not found")
    if session.tutor_id != tutor_id:
        raise ValidationError(detail="Not your session")

    existing = await db.execute(
        select(ChatRoomMapping).where(
            ChatRoomMapping.session_id == session_id,
            ChatRoomMapping.room_type == "broadcast",
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError(detail="Broadcast room already exists")

    matrix_room_id = f"!broadcast_{uuid.uuid4().hex[:16]}:localhost"

    room = ChatRoomMapping(
        matrix_room_id=matrix_room_id,
        room_type="broadcast",
        session_id=session_id,
    )
    db.add(room)
    await db.flush()
    return room


async def get_user_rooms(
    db: AsyncSession, account_id: uuid.UUID
) -> list[ChatRoomMapping]:
    result = await db.execute(
        select(ChatRoomMapping).where(
            or_(
                ChatRoomMapping.account_id_1 == account_id,
                ChatRoomMapping.account_id_2 == account_id,
            )
        )
    )
    return list(result.scalars().all())
