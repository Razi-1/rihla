import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Uuid,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Session(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "sessions"
    __table_args__ = (
        CheckConstraint(
            "session_type IN ('booking_meeting', 'individual_class', 'group_class')",
            name="ck_sessions_type",
        ),
        CheckConstraint(
            "mode IN ('online', 'physical', 'hybrid')",
            name="ck_sessions_mode",
        ),
        CheckConstraint(
            "status IN ('draft', 'active', 'completed', 'cancelled')",
            name="ck_sessions_status",
        ),
        CheckConstraint(
            "duration_minutes IN (30, 45, 60, 90, 120)",
            name="ck_sessions_duration",
        ),
        Index("idx_sessions_tutor", "tutor_id"),
        Index("idx_sessions_start_time", "start_time"),
        Index(
            "idx_sessions_series_root",
            "series_root_id",
            postgresql_where="series_root_id IS NOT NULL",
        ),
        Index(
            "idx_sessions_active",
            "id",
            postgresql_where="status = 'active'",
        ),
    )

    tutor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    session_type: Mapped[str] = mapped_column(String(20), nullable=False)
    mode: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="draft", nullable=False
    )
    location_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    location_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location_region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location_country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    series_root_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("sessions.id"), nullable=True
    )
    max_group_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    jitsi_room_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    individual_rate_override: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    group_rate_override: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    currency_override: Mapped[str | None] = mapped_column(
        String(3), nullable=True
    )

    recurrence_rule: Mapped["RecurrenceRule"] = relationship(
        back_populates="session", uselist=False
    )
    invites: Mapped[list["SessionInvite"]] = relationship(back_populates="session")
    enrolments: Mapped[list["Enrolment"]] = relationship(back_populates="session")


class RecurrenceRule(Base):
    __tablename__ = "recurrence_rules"
    __table_args__ = (
        CheckConstraint(
            "frequency IN ('weekly', 'biweekly', 'monthly')",
            name="ck_recurrence_frequency",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    frequency: Mapped[str] = mapped_column(String(20), nullable=False)
    days_of_week: Mapped[dict] = mapped_column(JSONB, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(__import__("datetime").timezone.utc),
        nullable=False,
    )

    session: Mapped["Session"] = relationship(back_populates="recurrence_rule")


class OccurrenceException(Base):
    __tablename__ = "occurrence_exceptions"
    __table_args__ = (
        UniqueConstraint("series_root_id", "original_start_time"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    series_root_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("sessions.id"), nullable=False
    )
    original_start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    new_start_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    new_end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_cancelled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(__import__("datetime").timezone.utc),
        nullable=False,
    )


from app.models.enrolment import Enrolment  # noqa: E402
from app.models.invite import SessionInvite  # noqa: E402
