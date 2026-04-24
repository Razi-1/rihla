import uuid
from decimal import Decimal

from sqlalchemy import Uuid, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class Country(UUIDMixin, Base):
    __tablename__ = "countries"

    code: Mapped[str] = mapped_column(String(3), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    regions: Mapped[list["Region"]] = relationship(back_populates="country")


class Region(UUIDMixin, Base):
    __tablename__ = "regions"
    __table_args__ = (UniqueConstraint("country_id", "code"),)

    country_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("countries.id"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    country: Mapped["Country"] = relationship(back_populates="regions")
    cities: Mapped[list["City"]] = relationship(back_populates="region")


class City(UUIDMixin, Base):
    __tablename__ = "cities"

    region_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("regions.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    population: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)

    region: Mapped["Region"] = relationship(back_populates="cities")
