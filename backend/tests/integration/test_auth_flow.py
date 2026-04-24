import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    register_data = {
        "email": "newuser@test.com",
        "password": "StrongPass1!",
        "account_type": "student",
        "first_name": "New",
        "last_name": "User",
        "date_of_birth": "2000-01-01",
        "government_id": "901234567V",
        "id_country_code": "LK",
    }
    response = await client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Account created. Please check your email to verify."


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    login_data = {
        "email": "nonexistent@test.com",
        "password": "WrongPass1!",
        "account_type": "student",
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_forgot_password_always_succeeds(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "anyone@test.com", "account_type": "student"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
