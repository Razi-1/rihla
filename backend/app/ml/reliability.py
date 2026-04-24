import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import AttendanceRecord
from app.models.enrolment import Enrolment
from app.models.ml import TutorMLVectors
from app.models.session import Session

logger = logging.getLogger(__name__)


async def compute_reliability(db: AsyncSession, tutor_id) -> TutorMLVectors | None:
    now = datetime.now(timezone.utc)
    six_months_ago = now - timedelta(days=180)

    sessions_result = await db.execute(
        select(Session).where(
            Session.tutor_id == tutor_id,
            Session.created_at >= six_months_ago,
        )
    )
    sessions = sessions_result.scalars().all()
    if not sessions:
        return None

    total = len(sessions)
    cancelled = sum(1 for s in sessions if s.status == "cancelled")
    completed = sum(1 for s in sessions if s.status == "completed")

    cancellation_rate = cancelled / total if total > 0 else 0

    students_result = await db.execute(
        select(func.count(func.distinct(Enrolment.student_id))).where(
            Enrolment.session_id.in_([s.id for s in sessions]),
            Enrolment.status == "active",
        )
    )
    total_students = students_result.scalar() or 0

    weeks = max(1, (now - six_months_ago).days / 7)
    sessions_per_week = completed / weeks

    reliability = max(0, 1.0 - cancellation_rate)

    existing = await db.execute(
        select(TutorMLVectors).where(TutorMLVectors.tutor_id == tutor_id)
    )
    vectors = existing.scalar_one_or_none()
    if vectors:
        vectors.reliability_score = Decimal(str(round(reliability, 4)))
        vectors.cancellation_rate_48h = Decimal(str(round(cancellation_rate, 4)))
        vectors.sessions_per_week_avg = Decimal(str(round(sessions_per_week, 2)))
        vectors.total_students_taught = total_students
        vectors.total_sessions_completed = completed
        vectors.last_computed_at = now
    else:
        vectors = TutorMLVectors(
            tutor_id=tutor_id,
            reliability_score=Decimal(str(round(reliability, 4))),
            cancellation_rate_48h=Decimal(str(round(cancellation_rate, 4))),
            sessions_per_week_avg=Decimal(str(round(sessions_per_week, 2))),
            total_students_taught=total_students,
            total_sessions_completed=completed,
            last_computed_at=now,
        )
        db.add(vectors)

    await db.flush()
    return vectors
