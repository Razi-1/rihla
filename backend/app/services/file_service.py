import logging
import uuid
from datetime import timedelta

from minio import Minio

from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "video/mp4",
    "video/quicktime",
    "video/webm",
}


def get_minio_client() -> Minio:
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


async def upload_file(
    bucket: str,
    entity_id: str,
    filename: str,
    data: bytes,
    content_type: str,
) -> str:
    if content_type not in ALLOWED_MIME_TYPES:
        raise ValueError(f"File type {content_type} not allowed")

    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(data) > max_size:
        raise ValueError(f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

    client = get_minio_client()
    import io
    from datetime import datetime, timezone

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    object_name = f"{entity_id}/{timestamp}_{filename}"

    client.put_object(
        bucket,
        object_name,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )

    return f"{bucket}/{object_name}"


async def get_presigned_url(bucket: str, object_name: str) -> str:
    client = get_minio_client()
    url = client.presigned_get_object(
        bucket, object_name, expires=timedelta(hours=1)
    )
    return url
