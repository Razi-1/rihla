import pytest

from app.utils.id_validation import validate_government_id


class TestSriLankaNIC:
    def test_old_format_male(self):
        is_valid, gender, error = validate_government_id("901234567V", "LK")
        assert is_valid
        assert gender == "male"

    def test_old_format_female(self):
        is_valid, gender, error = validate_government_id("905671234V", "LK")
        assert is_valid
        assert gender == "female"

    def test_new_format_male(self):
        is_valid, gender, error = validate_government_id("199012345678", "LK")
        assert is_valid
        assert gender == "male"

    def test_new_format_female(self):
        is_valid, gender, error = validate_government_id("199056712345", "LK")
        assert is_valid
        assert gender == "female"

    def test_invalid_format(self):
        is_valid, gender, error = validate_government_id("12345", "LK")
        assert not is_valid
        assert error is not None


class TestGenericValidation:
    def test_short_id_fails(self):
        is_valid, _, error = validate_government_id("123", "XX")
        assert not is_valid

    def test_reasonable_length_passes(self):
        is_valid, _, _ = validate_government_id("AB123456789", "XX")
        assert is_valid
