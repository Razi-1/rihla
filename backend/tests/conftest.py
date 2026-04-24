import asyncio
from datetime import date

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.database import get_db
from app.main import app
from app.models import Base
from app.models.account import Account
from app.models.student import StudentProfile
from app.models.tutor import TutorProfile

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionFactory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    async with TestSessionFactory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncClient:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_student(db_session: AsyncSession) -> Account:
    account = Account(
        email="student@test.com",
        account_type="student",
        password_hash=hash_password("Test1234!@"),
        government_id_encrypted="encrypted_test",
        government_id_hmac="test_hmac_student",
        id_country_code="LK",
        first_name="Test",
        last_name="Student",
        date_of_birth=date(2000, 1, 1),
        is_email_verified=True,
    )
    db_session.add(account)
    await db_session.flush()
    db_session.add(StudentProfile(account_id=account.id))
    await db_session.flush()
    return account


@pytest_asyncio.fixture
async def test_tutor(db_session: AsyncSession) -> Account:
    account = Account(
        email="tutor@test.com",
        account_type="tutor",
        password_hash=hash_password("Test1234!@"),
        government_id_encrypted="encrypted_test",
        government_id_hmac="test_hmac_tutor",
        id_country_code="LK",
        first_name="Test",
        last_name="Tutor",
        date_of_birth=date(1990, 6, 15),
        is_email_verified=True,
    )
    db_session.add(account)
    await db_session.flush()
    db_session.add(TutorProfile(account_id=account.id))
    await db_session.flush()
    return account


@pytest_asyncio.fixture
async def student_token(test_student: Account) -> str:
    from app.core.security import create_access_token

    return create_access_token(
        {"sub": str(test_student.id), "role": test_student.account_type}
    )


@pytest_asyncio.fixture
async def tutor_token(test_tutor: Account) -> str:
    from app.core.security import create_access_token

    return create_access_token(
        {"sub": str(test_tutor.id), "role": test_tutor.account_type}
    )
