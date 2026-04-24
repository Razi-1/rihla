import uuid
from datetime import time
from decimal import Decimal

from sqlalchemy import (
    
    Uuid,Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class TutorProfile(TimestampMixin, Base):
    __tablename__ = "tutor_profiles"

    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    mode_of_tuition: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    country_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("countries.id"), nullable=True
    )
    region_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("regions.id"), nullable=True
    )
    city_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("cities.id"), nullable=True
    )
    individual_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    group_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    is_profile_complete: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    timezone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    account: Mapped["Account"] = relationship(back_populates="tutor_profile")
    subjects: Mapped[list["TutorSubject"]] = relationship(
        back_populates="tutor_profile",
        foreign_keys="TutorSubject.tutor_id",
        primaryjoin="TutorProfile.account_id == TutorSubject.tutor_id",
    )
    working_hours: Mapped[list["TutorWorkingHours"]] = relationship(
        back_populates="tutor_profile",
        foreign_keys="TutorWorkingHours.tutor_id",
        primaryjoin="TutorProfile.account_id == TutorWorkingHours.tutor_id",
    )
    contacts: Mapped[list["TutorContact"]] = relationship(
        back_populates="tutor_profile",
        foreign_keys="TutorContact.tutor_id",
        primaryjoin="TutorProfile.account_id == TutorContact.tutor_id",
    )


class TutorSubject(Base):
    __tablename__ = "tutor_subjects"
    __table_args__ = (
        UniqueConstraint("tutor_id", "subject_id", "education_level_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    tutor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("subjects.id"), nullable=False
    )
    education_level_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("education_levels.id"), nullable=False
    )

    tutor_profile: Mapped["TutorProfile"] = relationship(
        back_populates="subjects",
        foreign_keys=[tutor_id],
        primaryjoin="TutorSubject.tutor_id == TutorProfile.account_id",
    )
    subject: Mapped["Subject"] = relationship()
    education_level: Mapped["EducationLevel"] = relationship()


class TutorWorkingHours(Base):
    __tablename__ = "tutor_working_hours"
    __table_args__ = (
        UniqueConstraint("tutor_id", "day_of_week"),
        CheckConstraint("day_of_week >= 0 AND day_of_week <= 6"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    tutor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_working: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), nullable=False)

    tutor_profile: Mapped["TutorProfile"] = relationship(
        back_populates="working_hours",
        foreign_keys=[tutor_id],
        primaryjoin="TutorWorkingHours.tutor_id == TutorProfile.account_id",
    )


class TutorContact(TimestampMixin, Base):
    __tablename__ = "tutor_contacts"
    __table_args__ = (
        UniqueConstraint("tutor_id", "contact_account_id"),
        CheckConstraint(
            "contact_type IN ('student', 'parent')",
            name="ck_tutor_contacts_type",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    tutor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=False
    )
    contact_account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("accounts.id"), nullable=False
    )
    contact_type: Mapped[str] = mapped_column(String(20), nullable=False)

    tutor_profile: Mapped["TutorProfile"] = relationship(
        back_populates="contacts",
        foreign_keys=[tutor_id],
        primaryjoin="TutorContact.tutor_id == TutorProfile.account_id",
    )


from app.models.account import Account  # noqa: E402
from app.models.subject import EducationLevel, Subject  # noqa: E402
