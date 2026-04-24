import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Account(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "accounts"
    __table_args__ = (
        UniqueConstraint("government_id_hmac", "account_type"),
        UniqueConstraint("email", "account_type"),
        CheckConstraint(
            "account_type IN ('student', 'tutor', 'parent', 'admin')",
            name="ck_accounts_account_type",
        ),
        Index("idx_accounts_email_type", "email", "account_type"),
        Index(
            "idx_accounts_age_restricted",
            "id",
            postgresql_where="is_age_restricted = TRUE",
        ),
        Index(
            "idx_accounts_pending_deletion",
            "id",
            postgresql_where="deletion_scheduled_for IS NOT NULL",
        ),
        Index(
            "idx_accounts_active",
            "id",
            postgresql_where="is_active = TRUE",
        ),
    )

    email: Mapped[str] = mapped_column(String(255), nullable=False)
    account_type: Mapped[str] = mapped_column(String(20), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    government_id_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    government_id_hmac: Mapped[str] = mapped_column(String(64), nullable=False)
    id_country_code: Mapped[str] = mapped_column(String(3), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone_country_code: Mapped[str | None] = mapped_column(String(5), nullable=True)
    profile_picture_url: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_restricted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_age_restricted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    deletion_requested_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    deletion_scheduled_for: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    student_profile: Mapped["StudentProfile"] = relationship(
        back_populates="account", uselist=False
    )
    tutor_profile: Mapped["TutorProfile"] = relationship(
        back_populates="account", uselist=False
    )
    parent_profile: Mapped["ParentProfile"] = relationship(
        back_populates="account", uselist=False
    )
    admin_profile: Mapped["AdminProfile"] = relationship(
        back_populates="account", uselist=False
    )


from app.models.admin import AdminProfile  # noqa: E402
from app.models.parent import ParentProfile  # noqa: E402
from app.models.student import StudentProfile  # noqa: E402
from app.models.tutor import TutorProfile  # noqa: E402
