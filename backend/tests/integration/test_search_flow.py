import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_search_tutors_public(client: AsyncClient):
    response = await client.get("/api/v1/search/tutors")
    assert response.status_code == 200
    data = response.json()
    assert "tutors" in data
    assert "has_more" in data


@pytest.mark.asyncio
async def test_search_with_filters(client: AsyncClient):
    response = await client.get("/api/v1/search/tutors?mode=online&limit=5")
    assert response.status_code == 200
