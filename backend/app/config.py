from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_ENV: str = "development"
    APP_URL: str = "https://localhost:3000"
    ADMIN_URL: str = "https://localhost:3001"
    API_URL: str = "https://localhost:8000"

    DATABASE_URL: str = "postgresql+asyncpg://rihla:password@localhost:5432/rihla"

    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET_KEY: str = ""
    JWT_REFRESH_SECRET_KEY: str = ""
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"

    FERNET_ENCRYPTION_KEY: str = ""
    HMAC_SECRET_KEY: str = ""
    CSRF_SECRET_KEY: str = ""

    MATRIX_HOMESERVER_URL: str = "http://localhost:8008"
    MATRIX_SERVER_NAME: str = "localhost"
    MATRIX_ADMIN_TOKEN: str = ""

    JITSI_URL: str = "https://localhost:8443"
    JITSI_JWT_SECRET: str = ""
    JITSI_APP_ID: str = "rihla"

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma4:e4b"

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_SECURE: bool = False
    MINIO_BUCKET_PROFILES: str = "profile-pictures"
    MINIO_BUCKET_MATERIALS: str = "class-materials"
    MINIO_BUCKET_QR: str = "qr-codes"

    MAILPIT_SMTP_HOST: str = "localhost"
    MAILPIT_SMTP_PORT: int = 1025

    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CREDENTIALS_PATH: str = "./firebase-credentials.json"

    CORS_ORIGINS: List[str] = [
        "https://localhost:3000",
        "https://localhost:3001",
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    MAX_UPLOAD_SIZE_MB: int = 50


settings = Settings()
