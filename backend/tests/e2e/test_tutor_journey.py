import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_tutor_can_view_profile(client: AsyncClient, tutor_token: str):
    response = await client.get(
        "/api/v1/tutors/me/profile",
        headers={"Authorization": f"Bearer {tutor_token}"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_tutor_can_create_and_cancel_session(
    client: AsyncClient, tutor_token: str
):
    create_resp = await client.post(
        "/api/v1/sessions",
        json={
            "title": "Physics Lesson",
            "session_type": "individual_class",
            "mode": "online",
            "duration_minutes": 60,
            "start_time": "2026-06-01T14:00:00Z",
        },
        headers={"Authorization": f"Bearer {tutor_token}"},
    )
    assert create_resp.status_code == 200
    session_id = create_resp.json()["id"]

    cancel_resp = await client.delete(
        f"/api/v1/sessions/{session_id}",
        headers={"Authorization": f"Bearer {tutor_token}"},
    )
    assert cancel_resp.status_code == 200
