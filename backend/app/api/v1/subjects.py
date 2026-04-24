from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.subject import EducationLevel, Subject, SubjectCategory
from app.schemas.subject import (
    EducationLevelResponse,
    SubjectCategoryResponse,
    SubjectResponse,
)

router = APIRouter()


@router.get("/categories", response_model=list[SubjectCategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SubjectCategory)
        .options(selectinload(SubjectCategory.subjects))
        .order_by(SubjectCategory.display_order)
    )
    categories = result.scalars().all()
    return [SubjectCategoryResponse.model_validate(c) for c in categories]


@router.get("", response_model=list[SubjectResponse])
async def list_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Subject)
        .options(selectinload(Subject.level_availability))
        .order_by(Subject.display_order)
    )
    subjects = result.scalars().all()
    return [SubjectResponse.model_validate(s) for s in subjects]


@router.get("/education-levels", response_model=list[EducationLevelResponse])
async def list_education_levels(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EducationLevel).order_by(EducationLevel.display_order)
    )
    levels = result.scalars().all()
    return [EducationLevelResponse.model_validate(l) for l in levels]
