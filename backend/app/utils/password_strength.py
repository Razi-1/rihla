import re
from pathlib import Path

COMMON_PASSWORDS: set[str] = set()


def _load_common_passwords() -> None:
    global COMMON_PASSWORDS
    pw_file = Path(__file__).parent.parent.parent / "data" / "common_passwords.txt"
    if pw_file.exists():
        COMMON_PASSWORDS = set(pw_file.read_text().strip().splitlines())


_load_common_passwords()


def check_password_strength(password: str) -> tuple[bool, list[str], int]:
    """Check password against requirements.

    Returns:
        Tuple of (meets_requirements, errors, strength_score 0-100)
    """
    errors: list[str] = []
    score = 0

    if len(password) < 8:
        errors.append("Password must be at least 8 characters")
    else:
        score += 20

    if len(password) >= 12:
        score += 10

    if re.search(r"[a-z]", password):
        score += 15
    else:
        errors.append("Password must contain a lowercase letter")

    if re.search(r"[A-Z]", password):
        score += 15
    else:
        errors.append("Password must contain an uppercase letter")

    if re.search(r"\d", password):
        score += 15
    else:
        errors.append("Password must contain a digit")

    if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        score += 15
    else:
        errors.append("Password must contain a special character")

    if password.lower() in COMMON_PASSWORDS:
        errors.append("This password is too common")
        score = max(0, score - 30)

    unique_chars = len(set(password))
    if unique_chars >= 8:
        score += 10

    score = min(100, score)
    meets_requirements = len(errors) == 0

    return meets_requirements, errors, score
