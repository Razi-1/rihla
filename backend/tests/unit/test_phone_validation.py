import pytest

from app.utils.phone_validation import get_country_code_from_phone, validate_phone


class TestPhoneValidation:
    def test_valid_sri_lanka_phone(self):
        is_valid, result = validate_phone("+94771234567")
        assert is_valid
        assert result.startswith("+94")

    def test_valid_pakistan_phone(self):
        is_valid, result = validate_phone("+923001234567")
        assert is_valid
        assert result.startswith("+92")

    def test_invalid_phone(self):
        is_valid, error = validate_phone("12345")
        assert not is_valid

    def test_country_code_extraction(self):
        code = get_country_code_from_phone("+94771234567")
        assert code == "+94"
