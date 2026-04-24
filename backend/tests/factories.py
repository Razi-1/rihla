import uuid
from datetime import date, datetime, timedelta, timezone

from app.core.security import hash_password
from app.models.account import Account
from app.models.session import Session


def make_account(
    email: str = "user@test.com",
    account_type: str = "student",
    password: str = "Test1234!@",
    **kwargs,
) -> Account:
    defaults = {
        "government_id_encrypted": "encrypted_test",
        "government_id_hmac": f"hmac_{uuid.uuid4().hex[:8]}",
        "id_country_code": "LK",
        "first_name": "Test",
        "last_name": "User",
        "date_of_birth": date(2000, 1, 1),
        "is_email_verified": True,
    }
    defaults.update(kwargs)
    return Account(
        email=email,
        account_type=account_type,
        password_hash=hash_password(password),
        **defaults,
    )


def make_session(
    tutor_id: uuid.UUID,
    title: str = "Test Session",
    session_type: str = "individual_class",
    start_time: datetime | None = None,
    **kwargs,
) -> Session:
    if start_time is None:
        start_time = datetime.now(timezone.utc) + timedelta(days=7)

    defaults = {
        "mode": "online",
        "status": "active",
        "duration_minutes": 60,
        "end_time": start_time + timedelta(minutes=60),
    }
    defaults.update(kwargs)
    return Session(
        tutor_id=tutor_id,
        title=title,
        session_type=session_type,
        start_time=start_time,
        **defaults,
    )
