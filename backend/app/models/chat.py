import uuid
from datetime import datetime

from sqlalchemy import Uuid, CheckConstraint, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ChatRoomMapping(Base):
    __tablename__ = "chat_room_mappings"
    __table_args__ = (
        CheckConstraint(
            "room_type IN ('dm', 'broadcast')",
            name="ck_chat_room_type",
        ),
        UniqueConstraint(
            "account_id_1",
            "account_id_2",
            name="uq_chat_dm_pair",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    matrix_room_id: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )
    room_type: Mapped[str] = mapped_column(String(20), nullable=False)
    account_id_1: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=True
    )
    account_id_2: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=True
    )
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("sessions.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(__import__("datetime").timezone.utc),
        nullable=False,
    )


class JitsiRoom(Base):
    __tablename__ = "jitsi_rooms"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("sessions.id"), nullable=False
    )
    room_name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(__import__("datetime").timezone.utc),
        nullable=False,
    )
