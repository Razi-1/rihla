import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_student_can_view_profile(client: AsyncClient, student_token: str):
    response = await client.get(
        "/api/v1/accounts/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["account_type"] == "student"
    assert data["first_name"] == "Test"


@pytest.mark.asyncio
async def test_student_can_view_notifications(client: AsyncClient, student_token: str):
    response = await client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_student_can_search_tutors(client: AsyncClient, student_token: str):
    response = await client.get(
        "/api/v1/search/tutors",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200
