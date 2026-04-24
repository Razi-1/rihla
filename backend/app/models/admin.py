import uuid

from sqlalchemy import Uuid, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class AdminProfile(TimestampMixin, Base):
    __tablename__ = "admin_profiles"

    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    must_change_password: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    account: Mapped["Account"] = relationship(back_populates="admin_profile")


from app.models.account import Account  # noqa: E402
