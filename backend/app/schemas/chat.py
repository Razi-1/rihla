import uuid

from pydantic import BaseModel


class CreateDMRoomRequest(BaseModel):
    target_account_id: uuid.UUID


class CreateBroadcastRoomRequest(BaseModel):
    session_id: uuid.UUID


class RoomResponse(BaseModel):
    id: uuid.UUID
    matrix_room_id: str
    room_type: str
    other_user_name: str | None = None
    session_title: str | None = None

    model_config = {"from_attributes": True}


class ContactResponse(BaseModel):
    account_id: uuid.UUID
    first_name: str
    last_name: str
    account_type: str
    profile_picture_url: str | None

    model_config = {"from_attributes": True}
