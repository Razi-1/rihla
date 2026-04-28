import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
from app.core.security import (
    compute_hmac,
    create_access_token,
    create_refresh_token,
    decrypt_data,
    encrypt_data,
    generate_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.account import Account
from app.models.admin import AdminProfile
from app.models.parent import ParentProfile
from app.models.student import StudentProfile
from app.models.token import EmailVerificationToken, PasswordResetToken, RefreshToken
from app.models.tutor import TutorProfile
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.utils.id_validation import validate_government_id
from app.utils.password_strength import check_password_strength

logger = logging.getLogger(__name__)


async def register(db: AsyncSession, data: RegisterRequest) -> tuple[Account, str]:
    """Register a new account.

    Returns:
        Tuple of (account, verification_token)
    """
    meets_reqs, errors, _ = check_password_strength(data.password)
    if not meets_reqs:
        raise ValidationError(detail="Password too weak", errors={"password": errors})

    is_valid, gender_extracted, id_error = validate_government_id(
        data.government_id, data.id_country_code
    )
    if not is_valid:
        raise ValidationError(
            detail=f"Invalid government ID: {id_error}",
            errors={"government_id": [id_error or "Invalid ID"]},
        )

    gov_id_hmac = compute_hmac(data.government_id)
    existing = await db.execute(
        select(Account).where(
            Account.government_id_hmac == gov_id_hmac,
            Account.account_type == data.account_type,
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError(detail="An account with this government ID already exists")

    existing_email = await db.execute(
        select(Account).where(
            Account.email == data.email,
            Account.account_type == data.account_type,
        )
    )
    if existing_email.scalar_one_or_none():
        raise ConflictError(detail="An account with this email already exists")

    dob = data.date_of_birth
    today = datetime.now(timezone.utc).date()
    age = (
        today.year
        - dob.year
        - ((today.month, today.day) < (dob.month, dob.day))
    )
    if age < 8 or age > 89:
        raise ValidationError(detail="Age must be between 8 and 89")

    gender = data.gender or gender_extracted
    is_age_restricted = age < 15 and data.account_type == "student"

    account = Account(
        email=data.email,
        account_type=data.account_type,
        password_hash=hash_password(data.password),
        government_id_encrypted=encrypt_data(data.government_id),
        government_id_hmac=gov_id_hmac,
        id_country_code=data.id_country_code.upper(),
        first_name=data.first_name,
        last_name=data.last_name,
        date_of_birth=data.date_of_birth,
        gender=gender,
        phone_number=data.phone_number,
        phone_country_code=data.phone_country_code,
        is_age_restricted=is_age_restricted,
    )
    db.add(account)
    await db.flush()

    if data.account_type == "student":
        db.add(StudentProfile(account_id=account.id))
    elif data.account_type == "tutor":
        db.add(TutorProfile(account_id=account.id))
    elif data.account_type == "parent":
        db.add(ParentProfile(account_id=account.id))

    raw_token = generate_token()
    verification_token = EmailVerificationToken(
        account_id=account.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(verification_token)
    await db.flush()

    logger.info("Account registered: %s (%s)", account.email, account.account_type)
    return account, raw_token


async def login(db: AsyncSession, data: LoginRequest) -> tuple[TokenResponse, str, "Account"]:
    """Authenticate user and return tokens.

    Returns:
        Tuple of (token_response, raw_refresh_token, account)
    """
    result = await db.execute(
        select(Account).where(
            Account.email == data.email,
            Account.account_type == data.account_type,
            Account.is_active == True,
        )
    )
    account = result.scalar_one_or_none()
    if not account or not verify_password(data.password, account.password_hash):
        raise UnauthorizedError(detail="Invalid email, account type, or password")

    access_token = create_access_token(
        {"sub": str(account.id), "type": "access", "role": account.account_type}
    )
    raw_refresh = generate_token()
    refresh_token_record = RefreshToken(
        account_id=account.id,
        token_hash=hash_token(raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(refresh_token_record)

    account.last_login_at = datetime.now(timezone.utc)
    await db.flush()

    token_response = TokenResponse(
        access_token=access_token,
        account_id=account.id,
        account_type=account.account_type,
        first_name=account.first_name,
        last_name=account.last_name,
        is_email_verified=account.is_email_verified,
        is_age_restricted=account.is_age_restricted,
    )
    return token_response, raw_refresh, account


async def refresh_access_token(
    db: AsyncSession, raw_refresh_token: str
) -> tuple[str, str]:
    """Refresh access token using refresh token.

    Returns:
        Tuple of (new_access_token, new_raw_refresh_token)
    """
    token_hash = hash_token(raw_refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    refresh_record = result.scalar_one_or_none()
    if not refresh_record:
        raise UnauthorizedError(detail="Invalid or expired refresh token")

    refresh_record.is_revoked = True

    account_result = await db.execute(
        select(Account).where(
            Account.id == refresh_record.account_id,
            Account.is_active == True,
        )
    )
    account = account_result.scalar_one_or_none()
    if not account:
        raise UnauthorizedError(detail="Account not found")

    new_access = create_access_token(
        {"sub": str(account.id), "type": "access", "role": account.account_type}
    )
    new_raw_refresh = generate_token()
    new_refresh_record = RefreshToken(
        account_id=account.id,
        token_hash=hash_token(new_raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(new_refresh_record)
    await db.flush()

    return new_access, new_raw_refresh


async def logout(db: AsyncSession, raw_refresh_token: str) -> None:
    token_hash = hash_token(raw_refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    refresh_record = result.scalar_one_or_none()
    if refresh_record:
        refresh_record.is_revoked = True
        await db.flush()


async def verify_email(db: AsyncSession, raw_token: str) -> Account:
    token_hash = hash_token(raw_token)
    result = await db.execute(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.is_used == False,
            EmailVerificationToken.expires_at > datetime.now(timezone.utc),
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise ValidationError(detail="Invalid or expired verification token")

    record.is_used = True
    account_result = await db.execute(
        select(Account).where(Account.id == record.account_id)
    )
    account = account_result.scalar_one_or_none()
    if not account:
        raise NotFoundError(detail="Account not found")

    account.is_email_verified = True
    await db.flush()
    return account


async def resend_verification(db: AsyncSession, account: Account) -> str:
    if account.is_email_verified:
        raise ValidationError(detail="Email already verified")

    raw_token = generate_token()
    token_record = EmailVerificationToken(
        account_id=account.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(token_record)
    await db.flush()
    return raw_token


async def forgot_password(
    db: AsyncSession, email: str, account_type: str
) -> str | None:
    """Returns raw reset token if account found, None otherwise.

    Always returns success to caller to prevent email enumeration.
    """
    result = await db.execute(
        select(Account).where(
            Account.email == email,
            Account.account_type == account_type,
            Account.is_active == True,
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        return None

    raw_token = generate_token()
    reset_record = PasswordResetToken(
        account_id=account.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db.add(reset_record)
    await db.flush()
    return raw_token


async def reset_password(
    db: AsyncSession, raw_token: str, new_password: str
) -> None:
    meets_reqs, errors, _ = check_password_strength(new_password)
    if not meets_reqs:
        raise ValidationError(detail="Password too weak", errors={"password": errors})

    token_hash = hash_token(raw_token)
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.is_used == False,
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise ValidationError(detail="Invalid or expired reset token")

    record.is_used = True
    account_result = await db.execute(
        select(Account).where(Account.id == record.account_id)
    )
    account = account_result.scalar_one_or_none()
    if not account:
        raise NotFoundError(detail="Account not found")

    account.password_hash = hash_password(new_password)
    await db.flush()


async def recover_email(
    db: AsyncSession,
    government_id: str,
    password: str,
    account_type: str,
    id_country_code: str,
) -> str:
    gov_id_hmac = compute_hmac(government_id)
    result = await db.execute(
        select(Account).where(
            Account.government_id_hmac == gov_id_hmac,
            Account.account_type == account_type,
            Account.is_active == True,
        )
    )
    account = result.scalar_one_or_none()
    if not account or not verify_password(password, account.password_hash):
        raise NotFoundError(detail="No matching account found")

    email = account.email
    parts = email.split("@")
    if len(parts) == 2:
        name = parts[0]
        if len(name) > 3:
            masked = name[:2] + "*" * (len(name) - 3) + name[-1]
        else:
            masked = name[0] + "*" * (len(name) - 1)
        return f"{masked}@{parts[1]}"
    return email
