import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Review(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating"),
        CheckConstraint(
            "is_deleted = FALSE OR admin_deletion_reason IS NOT NULL OR deleted_at IS NOT NULL",
            name="ck_reviews_deletion_reason",
        ),
        Index(
            "idx_reviews_tutor_active",
            "tutor_id",
            postgresql_where="is_deleted = FALSE",
        ),
    )

    tutor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    deleted_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=True
    )
    admin_deletion_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    authorship: Mapped["ReviewAuthorship"] = relationship(
        back_populates="review", uselist=False
    )
    duration_signal: Mapped["ReviewDurationSignal"] = relationship(
        back_populates="review", uselist=False
    )


class ReviewAuthorship(Base):
    __tablename__ = "review_authorships"
    __table_args__ = (UniqueConstraint("student_id", "tutor_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    review_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("reviews.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    tutor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=False
    )

    review: Mapped["Review"] = relationship(back_populates="authorship")


class ReviewDurationSignal(Base):
    __tablename__ = "review_duration_signals"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    review_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("reviews.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    sessions_attended: Mapped[int] = mapped_column(Integer, nullable=False)
    approximate_duration_weeks: Mapped[int] = mapped_column(
        Integer, nullable=False
    )

    review: Mapped["Review"] = relationship(back_populates="duration_signal")
