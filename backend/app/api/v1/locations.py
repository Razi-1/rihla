import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.location import City, Country, Region

router = APIRouter()


@router.get("/countries")
async def list_countries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Country).order_by(Country.name))
    countries = result.scalars().all()
    return {
        "data": [
            {"id": str(c.id), "code": c.code, "name": c.name} for c in countries
        ]
    }


@router.get("/regions/{country_id}")
async def list_regions(
    country_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Region)
        .where(Region.country_id == country_id)
        .order_by(Region.name)
    )
    regions = result.scalars().all()
    return {
        "data": [
            {"id": str(r.id), "code": r.code, "name": r.name} for r in regions
        ]
    }


@router.get("/cities/{region_id}")
async def list_cities(
    region_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(City).where(City.region_id == region_id).order_by(City.name)
    )
    cities = result.scalars().all()
    return {
        "data": [
            {"id": str(c.id), "name": c.name, "population": c.population}
            for c in cities
        ]
    }
