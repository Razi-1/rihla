from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.chat import (
    ContactResponse,
    CreateBroadcastRoomRequest,
    CreateDMRoomRequest,
    RoomResponse,
)
from app.services import chat_service

router = APIRouter()


@router.post("/rooms/dm", response_model=RoomResponse)
async def create_dm_room(
    data: CreateDMRoomRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    room = await chat_service.get_or_create_dm_room(
        db, current_user.id, data.target_account_id
    )
    return RoomResponse.model_validate(room)


@router.post("/rooms/broadcast", response_model=RoomResponse)
async def create_broadcast_room(
    data: CreateBroadcastRoomRequest,
    current_user: Account = Depends(require_role("tutor")),
    db: AsyncSession = Depends(get_db),
):
    room = await chat_service.create_broadcast_room(
        db, data.session_id, current_user.id
    )
    return RoomResponse.model_validate(room)


@router.get("/rooms", response_model=list[RoomResponse])
async def list_rooms(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    rooms = await chat_service.get_user_rooms(db, current_user.id)
    return [RoomResponse.model_validate(r) for r in rooms]
