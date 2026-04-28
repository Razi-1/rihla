import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.common import SuccessResponse
from app.schemas.invite import InviteActionRequest, InviteResponse
from app.services import invite_service

router = APIRouter()


def _enrich_invite(inv: "SessionInvite") -> InviteResponse:
    resp = InviteResponse.model_validate(inv)
    session = getattr(inv, "session", None)
    if session:
        resp.session_title = session.title
        resp.session_type = session.session_type
        resp.session_mode = getattr(session, "mode", None)
        resp.start_time = session.start_time
        resp.duration_minutes = getattr(session, "duration_minutes", None)
    return resp


@router.get("", response_model=list[InviteResponse])
async def list_invites(
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    invites = await invite_service.get_student_invites(db, current_user.id)
    return [_enrich_invite(inv) for inv in invites]


@router.get("/{invite_id}", response_model=InviteResponse)
async def get_invite(
    invite_id: uuid.UUID,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    invite = await invite_service.get_invite(db, invite_id)
    return _enrich_invite(invite)


@router.post("/{invite_id}/accept", response_model=SuccessResponse)
async def accept_invite(
    invite_id: uuid.UUID,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    await invite_service.accept_invite(db, invite_id, current_user.id)
    return SuccessResponse(message="Invite accepted")


@router.post("/{invite_id}/decline", response_model=SuccessResponse)
async def decline_invite(
    invite_id: uuid.UUID,
    data: InviteActionRequest,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    await invite_service.decline_invite(
        db, invite_id, current_user.id, data.note
    )
    return SuccessResponse(message="Invite declined")
