import logging
import re
import uuid
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account import Account
from app.models.location import City, Country, Region
from app.models.ml import TutorMLVectors, TutorSentiment
from app.models.review import Review
from app.models.subject import Subject
from app.models.tutor import TutorProfile, TutorSubject
from app.schemas.search import SearchFilters

logger = logging.getLogger(__name__)


async def structured_search(
    db: AsyncSession, filters: SearchFilters, authenticated: bool = False
) -> dict:
    query = (
        select(TutorProfile, Account, City.name, Region.name, Country.name)
        .join(Account, TutorProfile.account_id == Account.id)
        .outerjoin(City, TutorProfile.city_id == City.id)
        .outerjoin(Region, TutorProfile.region_id == Region.id)
        .outerjoin(Country, TutorProfile.country_id == Country.id)
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

    if filters.min_rate:
        query = query.where(
            or_(
                TutorProfile.individual_rate >= filters.min_rate,
                TutorProfile.group_rate >= filters.min_rate,
            )
        )

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

    if not rows:
        return {"data": [], "next_cursor": None, "has_more": False}

    tutor_ids = [row[1].id for row in rows]

    review_query = (
        select(
            Review.tutor_id,
            func.avg(Review.rating),
            func.count(Review.id),
        )
        .where(Review.tutor_id.in_(tutor_ids), Review.is_deleted == False)
        .group_by(Review.tutor_id)
    )
    review_result = await db.execute(review_query)
    review_map = {
        row[0]: (float(row[1]) if row[1] else None, row[2])
        for row in review_result.all()
    }

    from app.models.subject import Subject

    subject_query = (
        select(TutorSubject)
        .options(
            selectinload(TutorSubject.subject).selectinload(Subject.category),
            selectinload(TutorSubject.education_level),
        )
        .where(TutorSubject.tutor_id.in_(tutor_ids))
    )
    subject_result = await db.execute(subject_query)
    subject_rows = subject_result.scalars().all()
    subjects_map: dict[uuid.UUID, list[dict]] = {}
    for ts in subject_rows:
        entry = {
            "id": str(ts.id),
            "subject_id": str(ts.subject_id),
            "subject_name": ts.subject.name if ts.subject else "",
            "category_name": ts.subject.category.name if ts.subject and ts.subject.category else "",
            "education_level_id": str(ts.education_level_id),
            "education_level_name": ts.education_level.name if ts.education_level else "",
        }
        subjects_map.setdefault(ts.tutor_id, []).append(entry)

    sentiment_query = select(
        TutorSentiment.tutor_id, TutorSentiment.summary_text
    ).where(TutorSentiment.tutor_id.in_(tutor_ids))
    sentiment_result = await db.execute(sentiment_query)
    sentiment_map = {row[0]: row[1] for row in sentiment_result.all()}

    tutors = []
    for profile, account, city_name, region_name, country_name in rows:
        avg_rating, review_count = review_map.get(account.id, (None, 0))

        tutor_data = {
            "id": str(account.id),
            "first_name": account.first_name,
            "last_name": account.last_name,
            "profile_picture_url": account.profile_picture_url,
            "bio": profile.bio,
            "mode_of_tuition": profile.mode_of_tuition,
            "city_name": city_name,
            "region_name": region_name,
            "country_name": country_name,
            "currency": profile.currency,
            "subjects": subjects_map.get(account.id, []),
            "average_rating": avg_rating,
            "review_count": review_count,
            "sentiment_summary": sentiment_map.get(account.id),
        }

        if authenticated:
            tutor_data["individual_rate"] = (
                float(profile.individual_rate) if profile.individual_rate else None
            )
            tutor_data["group_rate"] = (
                float(profile.group_rate) if profile.group_rate else None
            )
        else:
            tutor_data["individual_rate"] = None
            tutor_data["group_rate"] = None

        tutors.append(tutor_data)

    next_cursor = None
    if has_more and tutors:
        next_cursor = tutors[-1]["id"]

    return {
        "data": tutors,
        "next_cursor": next_cursor,
        "has_more": has_more,
    }


async def extract_filters_from_query(
    db: AsyncSession,
    query: str,
    limit: int = 20,
    cursor: str | None = None,
) -> SearchFilters:
    """Extract structured search filters from a natural language query."""
    q = query.lower()
    filters = SearchFilters(limit=limit, cursor=cursor)

    if any(w in q for w in ["online", "remote", "virtual", "zoom"]):
        filters.mode = "online"
    elif any(w in q for w in ["in-person", "in person", "physical", "face to face", "home"]):
        filters.mode = "physical"
    elif "hybrid" in q:
        filters.mode = "hybrid"

    if "female" in q or "woman" in q or "lady" in q:
        filters.gender = "female"
    elif "male" in q and "female" not in q:
        filters.gender = "male"

    price_match = re.search(
        r"(?:under|below|less than|max|budget|cheaper than|up to)\s*(\d[\d,]*)",
        q,
    )
    if price_match:
        filters.max_rate = Decimal(price_match.group(1).replace(",", ""))

    min_match = re.search(r"(?:above|over|more than|at least|minimum)\s*(\d[\d,]*)", q)
    if min_match:
        filters.min_rate = Decimal(min_match.group(1).replace(",", ""))

    subjects_result = await db.execute(select(Subject.id, Subject.name))
    all_subjects = subjects_result.all()
    for subj_id, subj_name in all_subjects:
        if subj_name.lower() in q:
            filters.subject_id = subj_id
            break
    if not filters.subject_id:
        aliases = {
            "math": "Mathematics", "maths": "Mathematics",
            "physics": "Physics", "chemistry": "Chemistry",
            "bio": "Biology", "english": "English",
            "cs": "Computer Science", "ict": "ICT",
            "it": "ICT", "coding": "Computer Science",
            "programming": "Computer Science", "econ": "Economics",
            "art": "Art", "history": "History",
            "science": "Science", "sinhala": "Sinhala",
            "tamil": "Tamil",
        }
        for alias, canonical in aliases.items():
            if alias in q.split():
                for subj_id, subj_name in all_subjects:
                    if subj_name.lower() == canonical.lower():
                        filters.subject_id = subj_id
                        break
                if filters.subject_id:
                    break

    return filters


def describe_extracted_filters(filters: SearchFilters) -> str:
    """Produce a human-readable description of extracted filters."""
    parts: list[str] = []
    if filters.subject_id:
        parts.append(f"subject filter applied")
    if filters.mode:
        parts.append(f"mode: {filters.mode}")
    if filters.gender:
        parts.append(f"gender: {filters.gender}")
    if filters.max_rate:
        parts.append(f"max rate: {filters.max_rate}")
    if filters.min_rate:
        parts.append(f"min rate: {filters.min_rate}")
    if not parts:
        return "Showing all available tutors"
    return "Filtered by " + ", ".join(parts)
