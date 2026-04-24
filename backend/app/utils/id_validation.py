import re

from stdnum import get_cc_module


def validate_government_id(id_number: str, country_code: str) -> tuple[bool, str | None, str | None]:
    """Validate a government ID number.

    Returns:
        Tuple of (is_valid, gender_extracted, error_message)
    """
    country_code = country_code.upper()

    if country_code == "LK":
        return _validate_sri_lanka_nic(id_number)

    module = get_cc_module(country_code, "nationalid")
    if module is None:
        module = get_cc_module(country_code, "idnr")

    if module is None:
        if len(id_number) >= 5:
            return True, None, None
        return False, None, "ID number too short"

    try:
        module.validate(id_number)
        return True, None, None
    except Exception as e:
        return False, None, str(e)


def _validate_sri_lanka_nic(id_number: str) -> tuple[bool, str | None, str | None]:
    id_number = id_number.strip()

    old_nic = re.match(r"^(\d{9})([VvXx])$", id_number)
    if old_nic:
        digits = old_nic.group(1)
        day_of_year = int(digits[2:5])
        gender = "female" if day_of_year > 500 else "male"
        return True, gender, None

    new_nic = re.match(r"^(\d{12})$", id_number)
    if new_nic:
        day_of_year = int(id_number[4:7])
        gender = "female" if day_of_year > 500 else "male"
        return True, gender, None

    return False, None, "Invalid Sri Lanka NIC format"
