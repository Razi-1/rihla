import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.models.attendance import AttendanceRecord
from app.models.enrolment import Enrolment
from app.models.review import Review, ReviewAuthorship, ReviewDurationSignal
from app.schemas.review import ReviewCreateRequest, ReviewUpdateRequest

logger = logging.getLogger(__name__)


async def create_review(
    db: AsyncSession, student_id: uuid.UUID, data: ReviewCreateRequest
) -> Review:
    existing = await db.execute(
        select(ReviewAuthorship).where(
            ReviewAuthorship.student_id == student_id,
            ReviewAuthorship.tutor_id == data.tutor_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError(detail="You have already reviewed this tutor")

    from app.models.session import Session

    attended_result = await db.execute(
        select(func.count())
        .select_from(AttendanceRecord)
        .join(Session, AttendanceRecord.session_id == Session.id)
        .where(
            AttendanceRecord.student_id == student_id,
            Session.tutor_id == data.tutor_id,
        )
    )
    actual_sessions_attended = attended_result.scalar() or 0

    if actual_sessions_attended < 1:
        raise ValidationError(
            detail="You must attend at least 1 session with this tutor before reviewing"
        )

    review = Review(
        tutor_id=data.tutor_id,
        rating=data.rating,
        text=data.text,
    )
    db.add(review)
    await db.flush()

    authorship = ReviewAuthorship(
        review_id=review.id,
        student_id=student_id,
        tutor_id=data.tutor_id,
    )
    db.add(authorship)

    duration_signal = ReviewDurationSignal(
        review_id=review.id,
        sessions_attended=data.sessions_attended if data.sessions_attended else actual_sessions_attended,
        approximate_duration_weeks=data.approximate_duration_weeks,
    )
    db.add(duration_signal)
    await db.flush()

    logger.info("Review created for tutor %s by student %s", data.tutor_id, student_id)
    return review


async def get_tutor_reviews(
    db: AsyncSession,
    tutor_id: uuid.UUID,
    cursor: str | None = None,
    limit: int = 20,
) -> list[dict]:
    from app.models.account import Account

    query = (
        select(Review, ReviewAuthorship, ReviewDurationSignal)
        .outerjoin(ReviewAuthorship, ReviewAuthorship.review_id == Review.id)
        .outerjoin(ReviewDurationSignal, ReviewDurationSignal.review_id == Review.id)
        .where(
            Review.tutor_id == tutor_id,
            Review.is_deleted == False,
        )
    )
    if cursor:
        query = query.where(Review.created_at < datetime.fromisoformat(cursor))

    query = query.order_by(Review.created_at.desc()).limit(limit)
    result = await db.execute(query)

    rows = result.all()
    student_ids = [auth.student_id for _, auth, _ in rows if auth]
    student_map: dict[uuid.UUID, Account] = {}
    if student_ids:
        acct_result = await db.execute(
            select(Account).where(Account.id.in_(student_ids))
        )
        for acct in acct_result.scalars().all():
            student_map[acct.id] = acct

    reviews = []
    for review, authorship, duration in rows:
        student = student_map.get(authorship.student_id) if authorship else None
        weeks = duration.approximate_duration_weeks if duration else None
        reviews.append({
            "id": str(review.id),
            "tutor_id": str(review.tutor_id),
            "student_id": str(authorship.student_id) if authorship else None,
            "student_name": f"{student.first_name} {student.last_name}" if student else "Anonymous",
            "student_profile_picture": student.profile_picture_url if student else None,
            "rating": review.rating,
            "comment": review.text,
            "duration_months": round(weeks / 4) if weeks else None,
            "created_at": review.created_at.isoformat() if review.created_at else None,
            "updated_at": review.updated_at.isoformat() if review.updated_at else None,
        })
    return reviews


async def update_review(
    db: AsyncSession,
    review_id: uuid.UUID,
    student_id: uuid.UUID,
    data: ReviewUpdateRequest,
) -> Review:
    result = await db.execute(
        select(Review)
        .join(ReviewAuthorship, ReviewAuthorship.review_id == Review.id)
        .where(
            Review.id == review_id,
            ReviewAuthorship.student_id == student_id,
            Review.is_deleted == False,
        )
    )
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundError(detail="Review not found or not yours")

    if data.rating is not None:
        review.rating = data.rating
    if data.text is not None:
        review.text = data.text

    await db.flush()
    return review


async def delete_review(
    db: AsyncSession, review_id: uuid.UUID, student_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(Review)
        .join(ReviewAuthorship, ReviewAuthorship.review_id == Review.id)
        .where(
            Review.id == review_id,
            ReviewAuthorship.student_id == student_id,
        )
    )
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundError(detail="Review not found or not yours")

    review.is_deleted = True
    review.deleted_at = datetime.now(timezone.utc)
    await db.flush()


async def get_student_reviews(
    db: AsyncSession,
    student_id: uuid.UUID,
) -> list[dict]:
    from app.models.account import Account

    query = (
        select(Review, ReviewAuthorship, ReviewDurationSignal)
        .join(ReviewAuthorship, ReviewAuthorship.review_id == Review.id)
        .outerjoin(ReviewDurationSignal, ReviewDurationSignal.review_id == Review.id)
        .where(
            ReviewAuthorship.student_id == student_id,
            Review.is_deleted == False,
        )
        .order_by(Review.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    tutor_ids = [auth.tutor_id for _, auth, _ in rows]
    tutor_map: dict[uuid.UUID, Account] = {}
    if tutor_ids:
        acct_result = await db.execute(
            select(Account).where(Account.id.in_(tutor_ids))
        )
        for acct in acct_result.scalars().all():
            tutor_map[acct.id] = acct

    reviews = []
    for review, authorship, duration in rows:
        tutor = tutor_map.get(authorship.tutor_id)
        weeks = duration.approximate_duration_weeks if duration else None
        reviews.append({
            "id": str(review.id),
            "tutor_id": str(review.tutor_id),
            "tutor_name": f"{tutor.first_name} {tutor.last_name}" if tutor else "Unknown",
            "tutor_profile_picture": tutor.profile_picture_url if tutor else None,
            "rating": review.rating,
            "comment": review.text,
            "duration_months": round(weeks / 4) if weeks else None,
            "created_at": review.created_at.isoformat() if review.created_at else None,
            "updated_at": review.updated_at.isoformat() if review.updated_at else None,
        })
    return reviews


async def admin_delete_review(
    db: AsyncSession,
    review_id: uuid.UUID,
    admin_id: uuid.UUID,
    reason: str,
) -> None:
    review = await db.get(Review, review_id)
    if not review:
        raise NotFoundError(detail="Review not found")

    review.is_deleted = True
    review.deleted_at = datetime.now(timezone.utc)
    review.deleted_by_admin_id = admin_id
    review.admin_deletion_reason = reason
    await db.flush()
