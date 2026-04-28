import csv
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.admin import AuditLogResponse
from app.services import admin_service

router = APIRouter()


@router.get("", response_model=list[AuditLogResponse])
async def get_audit_log(
    action_type: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    entries = await admin_service.get_audit_log(db, cursor, limit, action_type)
    return [AuditLogResponse.model_validate(e) for e in entries]


@router.get("/export")
async def export_audit_log(
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    entries = await admin_service.get_audit_log(db, limit=10000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["ID", "Admin ID", "Action", "Target ID", "Target Type", "Reason", "Outcome", "Date"]
    )
    for entry in entries:
        writer.writerow([
            str(entry["id"]),
            str(entry["admin_id"]),
            entry["action_type"],
            str(entry["target_entity_id"]) if entry.get("target_entity_id") else "",
            entry.get("target_entity_type") or "",
            entry["reason"],
            entry.get("outcome", "success"),
            entry["created_at"].isoformat() if hasattr(entry["created_at"], "isoformat") else str(entry["created_at"]),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_log.csv"},
    )
