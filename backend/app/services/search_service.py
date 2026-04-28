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

    ml_vectors_query = select(
        TutorMLVectors.tutor_id,
        TutorMLVectors.reliability_score,
        TutorMLVectors.cancellation_rate_48h,
        TutorMLVectors.total_sessions_completed,
    ).where(TutorMLVectors.tutor_id.in_(tutor_ids))
    ml_result = await db.execute(ml_vectors_query)
    ml_map = {
        row[0]: {
            "reliability_score": row[1],
            "cancellation_rate": row[2],
            "sessions_completed": row[3],
        }
        for row in ml_result.all()
    }

    from app.ml.ranking import score_tutor, confidence_weight

    for t in tutors:
        tid = uuid.UUID(t["id"])
        avg_r = t.get("average_rating") or 0
        r_count = t.get("review_count") or 0
        ml_data = ml_map.get(tid, {})
        reliability = float(ml_data.get("reliability_score") or 0.5)
        cancellation = float(ml_data.get("cancellation_rate") or 0.0)
        sessions = int(ml_data.get("sessions_completed") or 0)

        sent_score = 0.5
        sent_row = sentiment_map.get(tid)
        if sent_row:
            sent_q = await db.execute(
                select(TutorSentiment.sentiment_score).where(TutorSentiment.tutor_id == tid)
            )
            s_val = sent_q.scalar_one_or_none()
            if s_val is not None:
                sent_score = float(s_val)

        features = {
            "reliability_score": reliability,
            "sentiment_score": sent_score,
            "review_count": r_count,
            "sessions_completed": sessions,
            "average_rating": avg_r,
            "cancellation_rate": cancellation,
        }
        raw_score = score_tutor(features)
        rank_score = confidence_weight(raw_score, r_count, 15)
        t["_rank_score"] = rank_score

    tutors.sort(key=lambda t: t["_rank_score"], reverse=True)
    for t in tutors:
        del t["_rank_score"]

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
    """Extract structured search filters from a natural language query.

    Tries Ollama NLP extraction first, falls back to regex.
    """
    filters = SearchFilters(limit=limit, cursor=cursor)

    subjects_result = await db.execute(select(Subject.id, Subject.name))
    all_subjects = subjects_result.all()
    subject_name_to_id = {name.lower(): sid for sid, name in all_subjects}

    try:
        from app.ml.nlp_extractor import extract_from_query
        extracted = await extract_from_query(query)
        if extracted and not extracted.get("raw_query"):
            logger.info("Ollama NLP extracted: %s", extracted)
            await _apply_nlp_params(db, filters, extracted, subject_name_to_id)
            if _has_any_filter(filters):
                return filters
            logger.info("NLP extraction produced no usable filters, falling back to regex")
    except Exception as e:
        logger.warning("Ollama NLP extraction failed, using regex fallback: %s", e)

    await _apply_regex_extraction(db, filters, query.lower(), all_subjects, subject_name_to_id)
    return filters


async def _resolve_location(
    db: AsyncSession,
    location_raw: str,
) -> tuple[uuid.UUID | None, uuid.UUID | None, uuid.UUID | None]:
    if not location_raw:
        return None, None, None
    loc_lower = location_raw.lower().strip()

    city_result = await db.execute(
        select(City).where(func.lower(City.name) == loc_lower)
    )
    city = city_result.scalar_one_or_none()
    if city:
        return None, None, city.id

    region_result = await db.execute(
        select(Region).where(func.lower(Region.name) == loc_lower)
    )
    region = region_result.scalar_one_or_none()
    if region:
        return None, region.id, None

    country_result = await db.execute(
        select(Country).where(
            or_(func.lower(Country.name) == loc_lower, func.lower(Country.code) == loc_lower)
        )
    )
    country = country_result.scalar_one_or_none()
    if country:
        return country.id, None, None

    city_like = await db.execute(
        select(City).where(func.lower(City.name).contains(loc_lower)).limit(1)
    )
    city_match = city_like.scalar_one_or_none()
    if city_match:
        return None, None, city_match.id

    region_like = await db.execute(
        select(Region).where(func.lower(Region.name).contains(loc_lower)).limit(1)
    )
    region_match = region_like.scalar_one_or_none()
    if region_match:
        return None, region_match.id, None

    return None, None, None


async def _apply_nlp_params(
    db: AsyncSession,
    filters: SearchFilters,
    params: dict,
    subject_map: dict[str, uuid.UUID],
) -> None:
    subject_raw = params.get("subject", "")
    if subject_raw:
        subj_lower = subject_raw.lower().strip()
        if subj_lower in subject_map:
            filters.subject_id = subject_map[subj_lower]
        else:
            ALIASES = {
                "math": "mathematics", "maths": "mathematics",
                "bio": "biology", "cs": "computer science",
                "ict": "ict", "coding": "computer science",
                "programming": "computer science", "econ": "economics",
            }
            canonical = ALIASES.get(subj_lower, subj_lower)
            if canonical in subject_map:
                filters.subject_id = subject_map[canonical]

    mode_raw = (params.get("mode") or "").lower().strip()
    MODE_MAP = {
        "online": "online", "remote": "online", "virtual": "online",
        "in-person": "physical", "in person": "physical",
        "physical": "physical", "face to face": "physical",
        "hybrid": "hybrid",
    }
    if mode_raw in MODE_MAP:
        filters.mode = MODE_MAP[mode_raw]

    gender_raw = (params.get("gender_preference") or "").lower().strip()
    if gender_raw in ("female", "male"):
        filters.gender = gender_raw

    budget_raw = params.get("budget")
    if budget_raw:
        budget_str = str(budget_raw).replace(",", "")
        nums = re.findall(r"\d+", budget_str)
        if nums:
            filters.max_rate = Decimal(nums[0])

    location_raw = params.get("location", "")
    if location_raw:
        country_id, region_id, city_id = await _resolve_location(db, location_raw)
        if city_id:
            filters.city_id = city_id
        elif region_id:
            filters.region_id = region_id
        elif country_id:
            filters.country_id = country_id


def _has_any_filter(filters: SearchFilters) -> bool:
    return any([
        filters.subject_id, filters.mode, filters.gender,
        filters.min_rate, filters.max_rate,
        filters.city_id, filters.region_id, filters.country_id,
    ])


async def _apply_regex_extraction(
    db: AsyncSession,
    filters: SearchFilters,
    q: str,
    all_subjects: list,
    subject_map: dict[str, uuid.UUID],
) -> None:
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

    for subj_id, subj_name in all_subjects:
        if subj_name.lower() in q:
            filters.subject_id = subj_id
            break
    if not filters.subject_id:
        aliases = {
            "math": "mathematics", "maths": "mathematics",
            "physics": "physics", "chemistry": "chemistry",
            "bio": "biology", "english": "english",
            "cs": "computer science", "ict": "ict",
            "it": "ict", "coding": "computer science",
            "programming": "computer science", "econ": "economics",
            "art": "art", "history": "history",
            "science": "science", "sinhala": "sinhala",
            "tamil": "tamil",
        }
        for alias, canonical in aliases.items():
            if alias in q.split():
                if canonical in subject_map:
                    filters.subject_id = subject_map[canonical]
                    break

    if not filters.city_id and not filters.region_id and not filters.country_id:
        location_keywords = re.findall(r"(?:in|from|near|around|at)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)", q)
        skip_words = {"person", "class", "online", "a", "the", "an", "sri", "lanka"}
        for loc_phrase in location_keywords:
            loc_clean = loc_phrase.strip()
            if loc_clean.lower() in skip_words:
                continue
            if loc_clean.lower() == "sri lanka" or loc_clean.lower() == "sri":
                continue
            country_id, region_id, city_id = await _resolve_location(db, loc_clean)
            if city_id or region_id or country_id:
                filters.city_id = city_id
                filters.region_id = region_id
                filters.country_id = country_id
                break


def describe_extracted_filters(filters: SearchFilters) -> str:
    """Produce a human-readable description of extracted filters."""
    parts: list[str] = []
    if filters.subject_id:
        parts.append("subject filter applied")
    if filters.mode:
        parts.append(f"mode: {filters.mode}")
    if filters.gender:
        parts.append(f"gender: {filters.gender}")
    if filters.max_rate:
        parts.append(f"max rate: {filters.max_rate}")
    if filters.min_rate:
        parts.append(f"min rate: {filters.min_rate}")
    if filters.city_id:
        parts.append("city filter applied")
    if filters.region_id:
        parts.append("region filter applied")
    if filters.country_id:
        parts.append("country filter applied")
    if not parts:
        return "Showing all available tutors (ranked by quality)"
    return "Filtered by " + ", ".join(parts) + " (ranked by relevance)"
