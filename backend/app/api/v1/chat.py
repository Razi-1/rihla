import uuid

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_role
from app.database import get_db
from app.models.account import Account
from app.models.chat import ChatRoomMapping
from app.schemas.chat import CreateBroadcastRoomRequest, CreateDMRoomRequest
from app.services import chat_service

router = APIRouter()


class SendMessageRequest(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


def _serialize_dm_room(
    room: ChatRoomMapping,
    current_user_id: uuid.UUID,
    account_map: dict[uuid.UUID, Account],
) -> dict:
    other_id = (
        room.account_id_2
        if room.account_id_1 == current_user_id
        else room.account_id_1
    )
    other = account_map.get(other_id) if other_id else None
    name = f"{other.first_name} {other.last_name}" if other else "Unknown"
    return {
        "room_id": str(room.id),
        "name": name,
        "type": room.room_type,
        "avatar_url": other.profile_picture_url if other else None,
        "last_message": None,
        "last_message_at": None,
        "unread_count": 0,
        "members": [
            {
                "account_id": str(other.id),
                "display_name": f"{other.first_name} {other.last_name}",
                "avatar_url": other.profile_picture_url,
                "account_type": other.account_type,
            }
        ]
        if other
        else [],
    }


@router.post("/rooms/dm")
async def create_dm_room(
    data: CreateDMRoomRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    room = await chat_service.get_or_create_dm_room(
        db, current_user.id, data.target_account_id
    )
    other = await db.get(Account, data.target_account_id)
    account_map = {data.target_account_id: other} if other else {}
    return {"data": _serialize_dm_room(room, current_user.id, account_map)}


@router.post("/rooms/broadcast")
async def create_broadcast_room(
    data: CreateBroadcastRoomRequest,
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    room = await chat_service.create_broadcast_room(
        db, data.session_id, current_user.id
    )
    from app.models.session import Session

    session = await db.get(Session, data.session_id)
    return {
        "data": {
            "room_id": str(room.id),
            "name": session.title if session else "Broadcast",
            "type": "broadcast",
            "avatar_url": None,
            "last_message": None,
            "last_message_at": None,
            "unread_count": 0,
            "members": [],
        }
    }


@router.get("/contacts")
async def get_contacts(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    from app.models.enrolment import Enrolment
    from app.models.session import Session

    contacts: list[dict] = []
    seen_ids: set[uuid.UUID] = set()

    if current_user.account_type == "student":
        result = await db.execute(
            select(Account)
            .join(Session, Session.tutor_id == Account.id)
            .join(Enrolment, Enrolment.session_id == Session.id)
            .where(
                Enrolment.student_id == current_user.id,
                Enrolment.status == "active",
            )
            .distinct()
        )
    elif current_user.account_type == "tutor":
        result = await db.execute(
            select(Account)
            .join(Enrolment, Enrolment.student_id == Account.id)
            .join(Session, Enrolment.session_id == Session.id)
            .where(
                Session.tutor_id == current_user.id,
                Enrolment.status == "active",
            )
            .distinct()
        )
    else:
        return {"data": []}

    for acct in result.scalars().all():
        if acct.id not in seen_ids:
            seen_ids.add(acct.id)
            contacts.append({
                "account_id": str(acct.id),
                "display_name": f"{acct.first_name} {acct.last_name}",
                "account_type": acct.account_type,
                "avatar_url": acct.profile_picture_url,
            })

    return {"data": contacts}


@router.get("/rooms")
async def list_rooms(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    rooms = await chat_service.get_user_rooms(db, current_user.id)

    other_ids: set[uuid.UUID] = set()
    for r in rooms:
        if r.room_type == "dm":
            if r.account_id_1 and r.account_id_1 != current_user.id:
                other_ids.add(r.account_id_1)
            if r.account_id_2 and r.account_id_2 != current_user.id:
                other_ids.add(r.account_id_2)

    account_map: dict[uuid.UUID, Account] = {}
    if other_ids:
        result = await db.execute(
            select(Account).where(Account.id.in_(list(other_ids)))
        )
        for acct in result.scalars().all():
            account_map[acct.id] = acct

    session_map: dict[uuid.UUID, str] = {}
    broadcast_session_ids = [
        r.session_id for r in rooms if r.room_type == "broadcast" and r.session_id
    ]
    if broadcast_session_ids:
        from app.models.session import Session

        sess_result = await db.execute(
            select(Session).where(Session.id.in_(broadcast_session_ids))
        )
        for s in sess_result.scalars().all():
            session_map[s.id] = s.title

    result_rooms = []
    for room in rooms:
        if room.room_type == "dm":
            result_rooms.append(
                _serialize_dm_room(room, current_user.id, account_map)
            )
        else:
            title = session_map.get(room.session_id, "Broadcast") if room.session_id else "Broadcast"
            result_rooms.append(
                {
                    "room_id": str(room.id),
                    "name": title,
                    "type": "broadcast",
                    "avatar_url": None,
                    "last_message": None,
                    "last_message_at": None,
                    "unread_count": 0,
                    "members": [],
                }
            )

    room_ids = [r.id for r in rooms]
    last_msgs = await chat_service.get_last_message_for_rooms(db, room_ids)
    for item in result_rooms:
        rid = uuid.UUID(item["room_id"])
        if rid in last_msgs:
            item["last_message"] = last_msgs[rid]["body"]
            item["last_message_at"] = last_msgs[rid]["created_at"]

    return {"data": result_rooms}


@router.get("/rooms/{room_id}/messages")
async def get_messages(
    room_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    messages = await chat_service.get_room_messages(
        db, room_id, current_user.id, limit
    )
    return {"data": messages}


@router.post("/rooms/{room_id}/messages")
async def send_message(
    room_id: uuid.UUID,
    data: SendMessageRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    msg = await chat_service.send_message(
        db, room_id, current_user.id, data.body
    )
    return {"data": msg}
