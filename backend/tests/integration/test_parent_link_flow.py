import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_link_child_requires_parent(client: AsyncClient, student_token: str):
    response = await client.post(
        "/api/v1/parents/me/link-child",
        json={"student_email": "child@test.com"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403
