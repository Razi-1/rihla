import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Uuid, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class TutorSentiment(Base):
    __tablename__ = "tutor_sentiment"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    tutor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("accounts.id"), unique=True, nullable=False
    )
    summary_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    sentiment_score: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 4), nullable=True
    )
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_computed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class TutorMLVectors(Base):
    __tablename__ = "tutor_ml_vectors"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    tutor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("accounts.id"), unique=True, nullable=False
    )
    reliability_score: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 4), nullable=True
    )
    cancellation_rate_48h: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 4), nullable=True
    )
    reschedule_rate_48h: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 4), nullable=True
    )
    sessions_per_week_avg: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    total_students_taught: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    total_sessions_completed: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    last_computed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
