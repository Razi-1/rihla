import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_session_requires_tutor(client: AsyncClient, student_token: str):
    response = await client.post(
        "/api/v1/sessions",
        json={
            "title": "Test Class",
            "session_type": "individual_class",
            "mode": "online",
            "duration_minutes": 60,
            "start_time": "2026-05-01T10:00:00Z",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_session_as_tutor(client: AsyncClient, tutor_token: str):
    response = await client.post(
        "/api/v1/sessions",
        json={
            "title": "Math 101",
            "session_type": "individual_class",
            "mode": "online",
            "duration_minutes": 60,
            "start_time": "2026-05-01T10:00:00Z",
        },
        headers={"Authorization": f"Bearer {tutor_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Math 101"
    assert data["jitsi_room_name"] is not None
