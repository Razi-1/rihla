import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class ParentProfile(TimestampMixin, Base):
    __tablename__ = "parent_profiles"

    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        primary_key=True,
    )

    account: Mapped["Account"] = relationship(back_populates="parent_profile")
    student_links: Mapped[list["ParentStudentLink"]] = relationship(
        back_populates="parent_profile",
        foreign_keys="ParentStudentLink.parent_id",
        primaryjoin="ParentStudentLink.parent_id == ParentProfile.account_id",
    )


class ParentStudentLink(Base):
    __tablename__ = "parent_student_links"
    __table_args__ = (
        UniqueConstraint("parent_id", "student_id"),
        CheckConstraint(
            "status IN ('pending', 'active')",
            name="ck_parent_student_links_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    parent_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(__import__("datetime").timezone.utc),
        nullable=False,
    )

    parent_profile: Mapped["ParentProfile"] = relationship(
        back_populates="student_links",
        foreign_keys=[parent_id],
        primaryjoin="ParentStudentLink.parent_id == ParentProfile.account_id",
    )


class ParentInviteToken(Base):
    __tablename__ = "parent_invite_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    parent_email: Mapped[str] = mapped_column(String(255), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(__import__("datetime").timezone.utc),
        nullable=False,
    )


class ParentTutorPermission(TimestampMixin, Base):
    __tablename__ = "parent_tutor_permissions"
    __table_args__ = (
        UniqueConstraint("parent_id", "student_id", "tutor_id"),
        CheckConstraint(
            "status IN ('pending', 'granted', 'denied')",
            name="ck_parent_tutor_permissions_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    parent_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=False
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=False
    )
    tutor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )


from app.models.account import Account  # noqa: E402
