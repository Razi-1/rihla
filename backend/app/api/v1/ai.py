from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.database import get_db

router = APIRouter()


class AIMessageRequest(BaseModel):
    message: str
    conversation_id: str | None = None


@router.post("/assistant/message")
async def send_message(
    data: AIMessageRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """AI assistant endpoint. Student gets Socratic tutor, Tutor gets general helper."""
    if current_user.account_type == "student":
        system_prompt = (
            "You are a Socratic tutor. Guide the student to discover answers "
            "through questions rather than giving direct answers. Be encouraging "
            "and patient."
        )
    elif current_user.account_type == "tutor":
        system_prompt = (
            "You are a helpful assistant for tutors. Help with lesson planning, "
            "teaching strategies, and administrative tasks."
        )
    else:
        return {"data": {"response": "AI assistant is available for students and tutors only."}}

    return {
        "data": {
            "response": (
                "AI assistant is not yet connected to the language model. "
                "Please ensure Ollama is running with the Gemma model loaded."
            ),
            "conversation_id": data.conversation_id,
            "model": "gemma4:e4b" if current_user.account_type == "student" else "phi3:mini",
        }
    }
