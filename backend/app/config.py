from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_ENV: str = "development"
    APP_URL: str = "https://localhost:3000"
    ADMIN_URL: str = "https://localhost:3001"
    API_URL: str = "https://localhost:8000"

    DATABASE_URL: str = "postgresql+asyncpg://rihla:rihla_dev_password_2026@localhost:5432/rihla"

    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET_KEY: str = "dev-jwt-secret-key-change-in-production"
    JWT_REFRESH_SECRET_KEY: str = "dev-jwt-refresh-secret-key-change-in-production"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"

    FERNET_ENCRYPTION_KEY: str = "IwvvbNq1K78Z6Vke5RjgpSpItRY3RAAB2k5RzmwWSYg="
    HMAC_SECRET_KEY: str = "dev-hmac-secret-key-change-in-production"
    CSRF_SECRET_KEY: str = "dev-csrf-secret-key-change-in-production"

    MATRIX_HOMESERVER_URL: str = "https://localhost:8448"
    MATRIX_SERVER_NAME: str = "localhost"
    MATRIX_ADMIN_TOKEN: str = ""

    JITSI_URL: str = "https://localhost:8443"
    JITSI_JWT_SECRET: str = "dev-jitsi-jwt-secret"
    JITSI_APP_ID: str = "rihla"

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma4:e4b"

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "rihla-minio-admin"
    MINIO_SECRET_KEY: str = "rihla-minio-secret-change"
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
