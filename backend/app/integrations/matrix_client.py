import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def create_matrix_user(user_id: str, display_name: str, password: str) -> bool:
    url = f"{settings.MATRIX_HOMESERVER_URL}/_synapse/admin/v2/users/@{user_id}:{settings.MATRIX_SERVER_NAME}"
    try:
        async with httpx.AsyncClient(verify=False) as client:
            response = await client.put(
                url,
                json={
                    "password": password,
                    "displayname": display_name,
                    "admin": False,
                },
                headers={"Authorization": f"Bearer {settings.MATRIX_ADMIN_TOKEN}"},
            )
            return response.status_code in (200, 201)
    except Exception as e:
        logger.error("Failed to create Matrix user %s: %s", user_id, e)
        return False


async def create_matrix_room(
    room_alias: str, name: str, invite_user_ids: list[str], is_direct: bool = False
) -> str | None:
    url = f"{settings.MATRIX_HOMESERVER_URL}/_matrix/client/v3/createRoom"
    try:
        async with httpx.AsyncClient(verify=False) as client:
            body = {
                "name": name,
                "preset": "private_chat" if is_direct else "private_chat",
                "invite": [
                    f"@{uid}:{settings.MATRIX_SERVER_NAME}" for uid in invite_user_ids
                ],
                "is_direct": is_direct,
            }
            response = await client.post(
                url,
                json=body,
                headers={"Authorization": f"Bearer {settings.MATRIX_ADMIN_TOKEN}"},
            )
            if response.status_code == 200:
                return response.json().get("room_id")
            return None
    except Exception as e:
        logger.error("Failed to create Matrix room: %s", e)
        return None
