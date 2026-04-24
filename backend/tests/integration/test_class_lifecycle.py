import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_subjects_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/subjects/categories")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_education_levels_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/subjects/education-levels")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_locations_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/locations/countries")
    assert response.status_code == 200
