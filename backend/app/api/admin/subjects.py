import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.core.exceptions import NotFoundError
from app.database import get_db
from app.models.account import Account
from app.models.subject import Subject, SubjectCategory, SubjectLevelAvailability
from app.schemas.common import SuccessResponse
from app.schemas.subject import (
    SubjectCategoryCreateRequest,
    SubjectCategoryResponse,
    SubjectCreateRequest,
    SubjectUpdateRequest,
)

router = APIRouter()


@router.post("/categories", response_model=SubjectCategoryResponse)
async def create_category(
    data: SubjectCategoryCreateRequest,
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    category = SubjectCategory(name=data.name, display_order=data.display_order)
    db.add(category)
    await db.flush()
    return SubjectCategoryResponse.model_validate(category)


@router.post("", response_model=SuccessResponse)
async def create_subject(
    data: SubjectCreateRequest,
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    subject = Subject(
        category_id=data.category_id,
        name=data.name,
        display_order=data.display_order,
    )
    db.add(subject)
    await db.flush()

    for level_id in data.education_level_ids:
        db.add(
            SubjectLevelAvailability(
                subject_id=subject.id,
                education_level_id=level_id,
            )
        )
    await db.flush()
    return SuccessResponse(message="Subject created", data={"id": str(subject.id)})


@router.put("/{subject_id}", response_model=SuccessResponse)
async def update_subject(
    subject_id: uuid.UUID,
    data: SubjectUpdateRequest,
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    subject = await db.get(Subject, subject_id)
    if not subject:
        raise NotFoundError(detail="Subject not found")

    if data.name is not None:
        subject.name = data.name
    if data.display_order is not None:
        subject.display_order = data.display_order

    if data.education_level_ids is not None:
        existing = await db.execute(
            select(SubjectLevelAvailability).where(
                SubjectLevelAvailability.subject_id == subject_id
            )
        )
        for sla in existing.scalars().all():
            await db.delete(sla)
        for level_id in data.education_level_ids:
            db.add(
                SubjectLevelAvailability(
                    subject_id=subject_id,
                    education_level_id=level_id,
                )
            )

    await db.flush()
    return SuccessResponse(message="Subject updated")


@router.delete("/{subject_id}", response_model=SuccessResponse)
async def delete_subject(
    subject_id: uuid.UUID,
    current_user: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    subject = await db.get(Subject, subject_id)
    if not subject:
        raise NotFoundError(detail="Subject not found")
    await db.delete(subject)
    await db.flush()
    return SuccessResponse(message="Subject deleted")
