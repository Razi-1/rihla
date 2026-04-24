import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_tutor_reviews_empty(client: AsyncClient, test_tutor):
    response = await client.get(f"/api/v1/reviews/tutor/{test_tutor.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["data"] == []
