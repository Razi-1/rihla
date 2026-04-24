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

    if account.account_type == "tutor":
        result = await db.execute(
            select(Session).where(
                Session.tutor_id == account.id,
                Session.start_time >= start,
                Session.end_time <= end,
                Session.status.in_(["active", "draft"]),
            )
        )
        for session in result.scalars().all():
            events.append(_session_to_event(session, "tutor"))

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
        for session in result.scalars().all():
            events.append(_session_to_event(session, "student"))

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
            for session in result.scalars().all():
                events.append(_session_to_event(session, "parent"))

    return events


def _session_to_event(session: Session, role: str) -> dict:
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
    }
