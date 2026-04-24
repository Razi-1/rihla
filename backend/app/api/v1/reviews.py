import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.database import get_db
from app.models.account import Account
from app.schemas.common import SuccessResponse
from app.schemas.review import ReviewCreateRequest, ReviewResponse, ReviewUpdateRequest
from app.services import review_service

router = APIRouter()


@router.post("", response_model=ReviewResponse)
async def create_review(
    data: ReviewCreateRequest,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    review = await review_service.create_review(db, current_user.id, data)
    return ReviewResponse(
        id=review.id,
        tutor_id=review.tutor_id,
        rating=review.rating,
        text=review.text,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.get("/tutor/{tutor_id}")
async def get_tutor_reviews(
    tutor_id: uuid.UUID,
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    reviews = await review_service.get_tutor_reviews(db, tutor_id, cursor, limit)
    return {"data": reviews}


@router.put("/{review_id}", response_model=SuccessResponse)
async def update_review(
    review_id: uuid.UUID,
    data: ReviewUpdateRequest,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    await review_service.update_review(db, review_id, current_user.id, data)
    return SuccessResponse(message="Review updated")


@router.delete("/{review_id}", response_model=SuccessResponse)
async def delete_review(
    review_id: uuid.UUID,
    current_user: Account = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    await review_service.delete_review(db, review_id, current_user.id)
    return SuccessResponse(message="Review deleted")
