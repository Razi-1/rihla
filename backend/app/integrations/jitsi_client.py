import secrets

from app.core.security import create_jitsi_jwt


def generate_room_name(session_id: str) -> str:
    short_id = session_id[:8]
    suffix = secrets.token_hex(4)
    return f"rihla-{short_id}-{suffix}"


def generate_jitsi_token(
    room_name: str,
    user_name: str,
    user_email: str,
    is_moderator: bool = False,
) -> str:
    return create_jitsi_jwt(room_name, user_name, user_email, is_moderator)
