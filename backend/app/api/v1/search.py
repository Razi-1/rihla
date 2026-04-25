from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.database import get_db
from app.schemas.search import AISearchRequest, SearchFilters
from app.services import search_service

router = APIRouter()


@router.get("/tutors")
async def search_tutors(
    filters: SearchFilters = Depends(),
    db: AsyncSession = Depends(get_db),
):
    results = await search_service.structured_search(db, filters, authenticated=False)
    return results


@router.post("/tutors/ai")
async def ai_search(
    data: AISearchRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    filters = await search_service.extract_filters_from_query(
        db, data.query, data.limit, data.cursor
    )
    interpretation = search_service.describe_extracted_filters(filters)
    results = await search_service.structured_search(db, filters, authenticated=True)
    return {
        "data": {
            "results": results["data"],
            "interpreted_query": interpretation,
            "next_cursor": results.get("next_cursor"),
            "has_more": results.get("has_more", False),
        }
    }
