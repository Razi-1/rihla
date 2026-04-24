import uuid

from sqlalchemy import JSON, Uuid, CheckConstraint, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class SessionInvite(TimestampMixin, Base):
    __tablename__ = "session_invites"
    __table_args__ = (
        UniqueConstraint("session_id", "student_id"),
        CheckConstraint(
            "status IN ('pending', 'accepted', 'declined')",
            name="ck_session_invites_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )
    conflict_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    declined_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    session: Mapped["Session"] = relationship(back_populates="invites")


from app.models.session import Session  # noqa: E402
