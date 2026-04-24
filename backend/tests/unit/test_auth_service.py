import pytest

from app.schemas.auth import RegisterRequest


class TestRegisterRequest:
    def test_valid_student_register(self):
        data = RegisterRequest(
            email="test@example.com",
            password="StrongPass1!",
            account_type="student",
            first_name="John",
            last_name="Doe",
            date_of_birth="2000-01-01",
            government_id="901234567V",
            id_country_code="LK",
        )
        assert data.email == "test@example.com"
        assert data.account_type == "student"

    def test_invalid_account_type(self):
        with pytest.raises(Exception):
            RegisterRequest(
                email="test@example.com",
                password="StrongPass1!",
                account_type="invalid",
                first_name="John",
                last_name="Doe",
                date_of_birth="2000-01-01",
                government_id="901234567V",
                id_country_code="LK",
            )

    def test_short_password(self):
        with pytest.raises(Exception):
            RegisterRequest(
                email="test@example.com",
                password="short",
                account_type="student",
                first_name="John",
                last_name="Doe",
                date_of_birth="2000-01-01",
                government_id="901234567V",
                id_country_code="LK",
            )
