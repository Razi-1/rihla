import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.enrolment import Enrolment
from app.models.session import Session


async def get_calendar_events(
    db: AsyncSession,
    account: Account,
    start: datetime,
    end: datetime,
) -> list[dict]:
    events = []
    sessions: list[Session] = []

    if account.account_type == "tutor":
        result = await db.execute(
            select(Session).where(
                Session.tutor_id == account.id,
                Session.start_time >= start,
                Session.end_time <= end,
                Session.status.in_(["active", "draft"]),
            )
        )
        sessions = list(result.scalars().all())

    elif account.account_type == "student":
        result = await db.execute(
            select(Session)
            .join(Enrolment, Enrolment.session_id == Session.id)
            .where(
                Enrolment.student_id == account.id,
                Enrolment.status == "active",
                Session.start_time >= start,
                Session.end_time <= end,
                Session.status.in_(["active", "draft"]),
            )
        )
        sessions = list(result.scalars().all())

    elif account.account_type == "parent":
        from app.models.parent import ParentStudentLink

        links_result = await db.execute(
            select(ParentStudentLink.student_id).where(
                ParentStudentLink.parent_id == account.id,
                ParentStudentLink.status == "active",
            )
        )
        student_ids = [row[0] for row in links_result.all()]

        if student_ids:
            result = await db.execute(
                select(Session)
                .join(Enrolment, Enrolment.session_id == Session.id)
                .where(
                    Enrolment.student_id.in_(student_ids),
                    Enrolment.status == "active",
                    Session.start_time >= start,
                    Session.end_time <= end,
                    Session.status.in_(["active", "draft"]),
                )
            )
            sessions = list(result.scalars().all())

    tutor_ids = {s.tutor_id for s in sessions}
    tutor_map: dict[uuid.UUID, Account] = {}
    if tutor_ids:
        acct_result = await db.execute(
            select(Account).where(Account.id.in_(tutor_ids))
        )
        for acct in acct_result.scalars().all():
            tutor_map[acct.id] = acct

    role = "tutor" if account.account_type == "tutor" else account.account_type
    for session in sessions:
        tutor = tutor_map.get(session.tutor_id)
        tutor_name = (
            f"{tutor.first_name} {tutor.last_name}" if tutor else None
        )
        events.append(_session_to_event(session, role, tutor_name))

    return events


def _session_to_event(
    session: Session, role: str, tutor_name: str | None = None
) -> dict:
    return {
        "id": str(session.id),
        "title": session.title,
        "start": session.start_time.isoformat(),
        "end": session.end_time.isoformat(),
        "session_type": session.session_type,
        "mode": session.mode,
        "status": session.status,
        "role": role,
        "location_city": session.location_city,
        "jitsi_room_name": session.jitsi_room_name,
        "tutor_name": tutor_name,
    }
