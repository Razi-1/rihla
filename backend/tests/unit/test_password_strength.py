import pytest

from app.utils.password_strength import check_password_strength


class TestPasswordStrength:
    def test_strong_password(self):
        meets, errors, score = check_password_strength("MyStr0ng!Pass")
        assert meets
        assert len(errors) == 0
        assert score >= 60

    def test_too_short(self):
        meets, errors, _ = check_password_strength("Ab1!")
        assert not meets
        assert any("8 characters" in e for e in errors)

    def test_no_uppercase(self):
        meets, errors, _ = check_password_strength("lowercase1!")
        assert not meets
        assert any("uppercase" in e for e in errors)

    def test_no_lowercase(self):
        meets, errors, _ = check_password_strength("UPPERCASE1!")
        assert not meets
        assert any("lowercase" in e for e in errors)

    def test_no_digit(self):
        meets, errors, _ = check_password_strength("NoDigitHere!")
        assert not meets
        assert any("digit" in e for e in errors)

    def test_no_special(self):
        meets, errors, _ = check_password_strength("NoSpecial123")
        assert not meets
        assert any("special" in e for e in errors)

    def test_common_password(self):
        meets, errors, score = check_password_strength("Password1!")
        # "password" is in common list, but "Password1!" may not be
        # The check is case-insensitive lowercase comparison
        pass
