import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.models.account import Account
from app.models.chat import ChatMessage, ChatRoomMapping
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
    from app.models.enrolment import Enrolment

    dm_result = await db.execute(
        select(ChatRoomMapping).where(
            ChatRoomMapping.room_type == "dm",
            or_(
                ChatRoomMapping.account_id_1 == account_id,
                ChatRoomMapping.account_id_2 == account_id,
            ),
        )
    )
    dm_rooms = list(dm_result.scalars().all())

    tutor_broadcast = await db.execute(
        select(ChatRoomMapping)
        .join(Session, ChatRoomMapping.session_id == Session.id)
        .where(
            ChatRoomMapping.room_type == "broadcast",
            Session.tutor_id == account_id,
        )
    )
    student_broadcast = await db.execute(
        select(ChatRoomMapping)
        .join(Session, ChatRoomMapping.session_id == Session.id)
        .join(Enrolment, Enrolment.session_id == Session.id)
        .where(
            ChatRoomMapping.room_type == "broadcast",
            Enrolment.student_id == account_id,
            Enrolment.status == "active",
        )
    )
    broadcast_rooms = list(tutor_broadcast.scalars().all()) + list(student_broadcast.scalars().all())

    seen_ids = set()
    all_rooms = []
    for room in dm_rooms + broadcast_rooms:
        if room.id not in seen_ids:
            seen_ids.add(room.id)
            all_rooms.append(room)
    return all_rooms


async def _verify_room_member(
    db: AsyncSession, room_id: uuid.UUID, account_id: uuid.UUID
) -> ChatRoomMapping:
    room = await db.get(ChatRoomMapping, room_id)
    if not room:
        raise NotFoundError(detail="Chat room not found")
    if room.room_type == "dm":
        if account_id not in (room.account_id_1, room.account_id_2):
            raise ForbiddenError(detail="Not a member of this room")
    return room


async def send_message(
    db: AsyncSession, room_id: uuid.UUID, sender_id: uuid.UUID, body: str
) -> dict:
    room = await _verify_room_member(db, room_id, sender_id)
    msg = ChatMessage(
        room_id=room_id,
        sender_id=sender_id,
        body=body,
        message_type="text",
    )
    db.add(msg)
    await db.flush()

    sender = await db.get(Account, sender_id)
    sender_name = f"{sender.first_name} {sender.last_name}" if sender else "Unknown"

    return {
        "event_id": str(msg.id),
        "room_id": str(msg.room_id),
        "sender_id": str(msg.sender_id),
        "sender_name": sender_name,
        "body": msg.body,
        "timestamp": int(msg.created_at.timestamp() * 1000),
        "type": msg.message_type,
    }


async def get_room_messages(
    db: AsyncSession, room_id: uuid.UUID, account_id: uuid.UUID, limit: int = 50
) -> list[dict]:
    await _verify_room_member(db, room_id, account_id)

    result = await db.execute(
        select(ChatMessage, Account)
        .join(Account, ChatMessage.sender_id == Account.id)
        .where(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    rows = list(reversed(result.all()))
    return [
        {
            "event_id": str(msg.id),
            "room_id": str(msg.room_id),
            "sender_id": str(msg.sender_id),
            "sender_name": f"{acct.first_name} {acct.last_name}",
            "body": msg.body,
            "timestamp": int(msg.created_at.timestamp() * 1000),
            "type": msg.message_type,
        }
        for msg, acct in rows
    ]


async def get_last_message_for_rooms(
    db: AsyncSession, room_ids: list[uuid.UUID]
) -> dict[uuid.UUID, dict]:
    from sqlalchemy import func

    if not room_ids:
        return {}

    subq = (
        select(
            ChatMessage.room_id,
            func.max(ChatMessage.created_at).label("max_ts"),
        )
        .where(ChatMessage.room_id.in_(room_ids))
        .group_by(ChatMessage.room_id)
        .subquery()
    )
    result = await db.execute(
        select(ChatMessage)
        .join(subq, (ChatMessage.room_id == subq.c.room_id) & (ChatMessage.created_at == subq.c.max_ts))
    )
    last_msgs = {}
    for msg in result.scalars().all():
        last_msgs[msg.room_id] = {
            "body": msg.body,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
    return last_msgs
