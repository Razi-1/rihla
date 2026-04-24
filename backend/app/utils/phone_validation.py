import phonenumbers
from phonenumbers import PhoneNumberFormat


def validate_phone(phone: str, country_code: str = "LK") -> tuple[bool, str | None]:
    """Validate and format a phone number to E.164.

    Returns:
        Tuple of (is_valid, formatted_number_or_error)
    """
    try:
        parsed = phonenumbers.parse(phone, country_code)
        if not phonenumbers.is_valid_number(parsed):
            return False, "Invalid phone number"
        formatted = phonenumbers.format_number(parsed, PhoneNumberFormat.E164)
        return True, formatted
    except phonenumbers.NumberParseException as e:
        return False, str(e)


def get_country_code_from_phone(phone: str) -> str | None:
    try:
        parsed = phonenumbers.parse(phone, None)
        return f"+{parsed.country_code}"
    except phonenumbers.NumberParseException:
        return None
