import logging
import uuid
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account import Account
from app.models.ml import TutorMLVectors, TutorSentiment
from app.models.review import Review
from app.models.tutor import TutorProfile, TutorSubject
from app.schemas.search import SearchFilters

logger = logging.getLogger(__name__)


async def structured_search(
    db: AsyncSession, filters: SearchFilters, authenticated: bool = False
) -> dict:
    query = (
        select(TutorProfile, Account)
        .join(Account, TutorProfile.account_id == Account.id)
        .where(
            Account.is_active == True,
            TutorProfile.is_profile_complete == True,
            Account.is_restricted == False,
        )
    )

    if filters.subject_id:
        query = query.where(
            TutorProfile.account_id.in_(
                select(TutorSubject.tutor_id).where(
                    TutorSubject.subject_id == filters.subject_id
                )
            )
        )

    if filters.education_level_id:
        query = query.where(
            TutorProfile.account_id.in_(
                select(TutorSubject.tutor_id).where(
                    TutorSubject.education_level_id == filters.education_level_id
                )
            )
        )

    if filters.mode:
        query = query.where(
            or_(
                TutorProfile.mode_of_tuition == filters.mode,
                TutorProfile.mode_of_tuition == "hybrid",
            )
        )

    if filters.country_id:
        query = query.where(TutorProfile.country_id == filters.country_id)
    if filters.region_id:
        query = query.where(TutorProfile.region_id == filters.region_id)
    if filters.city_id:
        query = query.where(TutorProfile.city_id == filters.city_id)

    if filters.max_rate:
        query = query.where(
            or_(
                TutorProfile.individual_rate <= filters.max_rate,
                TutorProfile.group_rate <= filters.max_rate,
            )
        )

    if filters.gender:
        query = query.where(Account.gender == filters.gender)

    query = query.limit(filters.limit + 1)
    result = await db.execute(query)
    rows = result.all()

    has_more = len(rows) > filters.limit
    rows = rows[: filters.limit]

    tutors = []
    for profile, account in rows:
        review_result = await db.execute(
            select(
                func.avg(Review.rating),
                func.count(Review.id),
            ).where(
                Review.tutor_id == account.id,
                Review.is_deleted == False,
            )
        )
        avg_rating, review_count = review_result.one()

        tutor_data = {
            "account_id": str(account.id),
            "first_name": account.first_name,
            "last_name": account.last_name,
            "profile_picture_url": account.profile_picture_url,
            "bio": profile.bio,
            "mode_of_tuition": profile.mode_of_tuition,
            "currency": profile.currency,
            "average_rating": float(avg_rating) if avg_rating else None,
            "review_count": review_count,
        }

        if authenticated:
            tutor_data["individual_rate"] = (
                str(profile.individual_rate) if profile.individual_rate else None
            )
            tutor_data["group_rate"] = (
                str(profile.group_rate) if profile.group_rate else None
            )
        else:
            tutor_data["individual_rate"] = None
            tutor_data["group_rate"] = None

        tutors.append(tutor_data)

    next_cursor = None
    if has_more and tutors:
        next_cursor = tutors[-1]["account_id"]

    return {
        "tutors": tutors,
        "next_cursor": next_cursor,
        "has_more": has_more,
    }
