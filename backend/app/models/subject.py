import uuid

from sqlalchemy import Uuid, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class SubjectCategory(UUIDMixin, Base):
    __tablename__ = "subject_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    subjects: Mapped[list["Subject"]] = relationship(back_populates="category")


class Subject(UUIDMixin, Base):
    __tablename__ = "subjects"
    __table_args__ = (UniqueConstraint("category_id", "name"),)

    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("subject_categories.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    category: Mapped["SubjectCategory"] = relationship(back_populates="subjects")
    level_availability: Mapped[list["SubjectLevelAvailability"]] = relationship(
        back_populates="subject"
    )


class EducationLevel(UUIDMixin, Base):
    __tablename__ = "education_levels"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    min_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_age: Mapped[int | None] = mapped_column(Integer, nullable=True)


class SubjectLevelAvailability(UUIDMixin, Base):
    __tablename__ = "subject_level_availability"
    __table_args__ = (UniqueConstraint("subject_id", "education_level_id"),)

    subject_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
    )
    education_level_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("education_levels.id", ondelete="CASCADE"),
        nullable=False,
    )

    subject: Mapped["Subject"] = relationship(back_populates="level_availability")
    education_level: Mapped["EducationLevel"] = relationship()
