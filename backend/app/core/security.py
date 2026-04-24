import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from cryptography.fernet import Fernet, InvalidToken
from jose import JWTError, jwt

from app.config import settings

ph = PasswordHasher()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return ph.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(
        to_encode, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_REFRESH_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def encrypt_data(plaintext: str) -> str:
    key = settings.FERNET_ENCRYPTION_KEY
    if not isinstance(key, bytes):
        key = key.encode()
    f = Fernet(key)
    return f.encrypt(plaintext.encode()).decode()


def decrypt_data(ciphertext: str) -> str | None:
    try:
        key = settings.FERNET_ENCRYPTION_KEY
        if not isinstance(key, bytes):
            key = key.encode()
        f = Fernet(key)
        return f.decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        return None


def compute_hmac(data: str) -> str:
    return hmac.new(
        settings.HMAC_SECRET_KEY.encode(),
        data.encode(),
        hashlib.sha256,
    ).hexdigest()


def verify_hmac(data: str, expected_hmac: str) -> bool:
    computed = compute_hmac(data)
    return hmac.compare_digest(computed, expected_hmac)


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_csrf_token() -> str:
    return hmac.new(
        settings.CSRF_SECRET_KEY.encode(),
        secrets.token_bytes(32),
        hashlib.sha256,
    ).hexdigest()


def create_jitsi_jwt(
    room_name: str, user_name: str, user_email: str, is_moderator: bool = False
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "iss": settings.JITSI_APP_ID,
        "aud": "jitsi",
        "sub": settings.JITSI_APP_ID,
        "room": room_name,
        "exp": now + timedelta(hours=2),
        "iat": now,
        "context": {
            "user": {
                "name": user_name,
                "email": user_email,
                "moderator": is_moderator,
            }
        },
    }
    return jwt.encode(
        payload, settings.JITSI_JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
