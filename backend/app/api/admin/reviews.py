import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.models.review import Review
from app.schemas.admin import RestrictAccountRequest
from app.schemas.common import SuccessResponse
from app.services import review_service

router = APIRouter()


@router.get("")
async def list_reviews(
    tutor_id: uuid.UUID | None = Query(None),
    limit: int = Query(25, ge=1, le=100),
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    query = select(Review)
    if tutor_id:
        query = query.where(Review.tutor_id == tutor_id)
    query = query.order_by(Review.created_at.desc()).limit(limit)
    result = await db.execute(query)
    reviews = result.scalars().all()
    return {
        "data": [
            {
                "id": str(r.id),
                "tutor_id": str(r.tutor_id),
                "rating": r.rating,
                "text": r.text,
                "is_deleted": r.is_deleted,
                "created_at": r.created_at.isoformat(),
            }
            for r in reviews
        ]
    }


@router.delete("/{review_id}", response_model=SuccessResponse)
async def delete_review(
    review_id: uuid.UUID,
    data: RestrictAccountRequest,
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await review_service.admin_delete_review(
        db, review_id, current_user.id, data.reason
    )
    return SuccessResponse(message="Review deleted")
