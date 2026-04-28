import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.common import SuccessResponse
from app.schemas.enrolment import EnrolmentResponse
from app.services import enrolment_service

router = APIRouter()


def _enrich_enrolment(e: "Enrolment", tutor_map: dict | None = None) -> EnrolmentResponse:
    resp = EnrolmentResponse.model_validate(e)
    session = getattr(e, "session", None)
    if session:
        resp.session_title = session.title
        if tutor_map and session.tutor_id in tutor_map:
            acct = tutor_map[session.tutor_id]
            resp.tutor_name = f"{acct.first_name} {acct.last_name}"
    return resp


@router.get("", response_model=list[EnrolmentResponse])
async def list_enrolments(
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select

    enrolments = await enrolment_service.get_student_enrolments(
        db, current_user.id
    )
    tutor_ids = {e.session.tutor_id for e in enrolments if getattr(e, "session", None)}
    tutor_map = {}
    if tutor_ids:
        result = await db.execute(select(Account).where(Account.id.in_(list(tutor_ids))))
        tutor_map = {a.id: a for a in result.scalars().all()}
    return [_enrich_enrolment(e, tutor_map) for e in enrolments]


@router.post("/{enrolment_id}/opt-out", response_model=SuccessResponse)
async def opt_out(
    enrolment_id: uuid.UUID,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    await enrolment_service.opt_out(db, enrolment_id, current_user.id)
    return SuccessResponse(message="Opted out successfully")
