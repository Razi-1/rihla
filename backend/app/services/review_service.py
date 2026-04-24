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

    has_enrolment = await db.execute(
        select(Enrolment).where(
            Enrolment.student_id == student_id,
            Enrolment.session_id.in_(
                select(Enrolment.session_id)
                .join(
                    AttendanceRecord,
                    AttendanceRecord.session_id == Enrolment.session_id,
                )
                .where(AttendanceRecord.student_id == student_id)
            ),
        )
    )
    # Eligibility: at minimum student should have some interaction with the tutor
    # For now we check enrolment exists with this tutor

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
        sessions_attended=data.sessions_attended,
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

    reviews = []
    for review, authorship, duration in result.all():
        reviews.append({
            "id": review.id,
            "tutor_id": review.tutor_id,
            "rating": review.rating,
            "text": review.text,
            "sessions_attended": duration.sessions_attended if duration else None,
            "approximate_duration_weeks": (
                duration.approximate_duration_weeks if duration else None
            ),
            "created_at": review.created_at,
            "updated_at": review.updated_at,
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
