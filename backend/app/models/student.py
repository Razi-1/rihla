import uuid

from sqlalchemy import Uuid, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class StudentProfile(TimestampMixin, Base):
    __tablename__ = "student_profiles"

    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    education_level_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("education_levels.id"),
        nullable=True,
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    account: Mapped["Account"] = relationship(back_populates="student_profile")
    education_level: Mapped["EducationLevel"] = relationship()
    subjects: Mapped[list["StudentSubject"]] = relationship(
        back_populates="student_profile",
        foreign_keys="StudentSubject.student_id",
        primaryjoin="StudentProfile.account_id == StudentSubject.student_id",
    )


class StudentSubject(Base):
    __tablename__ = "student_subjects"
    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", "education_level_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
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

    student_profile: Mapped["StudentProfile"] = relationship(
        back_populates="subjects",
        foreign_keys=[student_id],
        primaryjoin="StudentSubject.student_id == StudentProfile.account_id",
    )


from app.models.account import Account  # noqa: E402
from app.models.subject import EducationLevel  # noqa: E402
