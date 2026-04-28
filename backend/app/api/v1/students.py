from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.student import StudentProfileResponse, StudentProfileUpdateRequest
from app.services import student_service

router = APIRouter()


@router.get("/me/dashboard")
async def get_dashboard(
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    dashboard = await student_service.get_student_dashboard(db, current_user.id)
    return {"data": dashboard}


@router.get("/me/profile", response_model=StudentProfileResponse)
async def get_profile(
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    profile = await student_service.get_student_profile(db, current_user.id)
    return StudentProfileResponse.model_validate(profile)


@router.get("/me/classes")
async def get_classes(
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    from app.models.session import Session
    from app.models.enrolment import Enrolment

    result = await db.execute(
        select(Session, Account)
        .join(Enrolment, Enrolment.session_id == Session.id)
        .join(Account, Session.tutor_id == Account.id)
        .where(
            Enrolment.student_id == current_user.id,
            Enrolment.status == "active",
        )
        .order_by(Session.start_time.desc())
    )
    classes = []
    for session, tutor in result.all():
        classes.append({
            "id": str(session.id),
            "tutor_id": str(session.tutor_id),
            "tutor_name": f"{tutor.first_name} {tutor.last_name}",
            "title": session.title,
            "session_type": session.session_type,
            "mode": session.mode,
            "status": session.status,
            "start_time": session.start_time.isoformat(),
            "end_time": session.end_time.isoformat(),
            "duration_minutes": session.duration_minutes,
            "jitsi_room_name": session.jitsi_room_name,
        })
    return {"data": classes, "next_cursor": None, "has_more": False}


@router.put("/me/profile", response_model=StudentProfileResponse)
async def update_profile(
    data: StudentProfileUpdateRequest,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    profile = await student_service.update_student_profile(
        db, current_user.id, data
    )
    return StudentProfileResponse.model_validate(profile)
