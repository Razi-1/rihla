from fastapi import APIRouter, File, Form, UploadFile

from app.core.auth import CurrentUser
from app.services import file_service

router = APIRouter()


@router.post("/upload")
async def upload_file(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    bucket: str = Form("class-materials"),
):
    data = await file.read()
    key = await file_service.upload_file(
        bucket=bucket,
        entity_id=str(current_user.id),
        filename=file.filename or "upload",
        data=data,
        content_type=file.content_type or "application/octet-stream",
    )
    return {"data": {"key": key}}


@router.get("/{key:path}")
async def get_file_url(key: str, current_user: CurrentUser):
    parts = key.split("/", 1)
    if len(parts) != 2:
        return {"detail": "Invalid key format"}
    bucket, object_name = parts
    url = await file_service.get_presigned_url(bucket, object_name)
    return {"data": {"url": url}}
