from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.subject import (
    EducationLevel,
    Subject,
    SubjectCategory,
    SubjectLevelAvailability,
)

router = APIRouter()


def _serialize_level(level: EducationLevel) -> dict:
    return {
        "id": str(level.id),
        "name": level.name,
        "display_order": level.display_order,
        "min_age": level.min_age,
        "max_age": level.max_age,
    }


def _serialize_subject(subject: Subject) -> dict:
    return {
        "id": str(subject.id),
        "category_id": str(subject.category_id),
        "name": subject.name,
        "display_order": subject.display_order,
        "education_levels": [
            _serialize_level(sla.education_level)
            for sla in subject.level_availability
            if sla.education_level
        ],
    }


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SubjectCategory)
        .options(
            selectinload(SubjectCategory.subjects)
            .selectinload(Subject.level_availability)
            .selectinload(SubjectLevelAvailability.education_level)
        )
        .order_by(SubjectCategory.display_order)
    )
    categories = result.scalars().all()
    return {
        "data": [
            {
                "id": str(c.id),
                "name": c.name,
                "display_order": c.display_order,
                "subjects": [_serialize_subject(s) for s in c.subjects],
            }
            for c in categories
        ]
    }


@router.get("")
async def list_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Subject)
        .options(
            selectinload(Subject.level_availability)
            .selectinload(SubjectLevelAvailability.education_level)
        )
        .order_by(Subject.display_order)
    )
    subjects = result.scalars().all()
    return {"data": [_serialize_subject(s) for s in subjects]}


@router.get("/education-levels")
async def list_education_levels(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EducationLevel).order_by(EducationLevel.display_order)
    )
    levels = result.scalars().all()
    return {"data": [_serialize_level(l) for l in levels]}
