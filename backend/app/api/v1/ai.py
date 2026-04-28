import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import httpx

from app.config import settings
from app.core.auth import CurrentUser
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


class HistoryMessage(BaseModel):
    role: str
    content: str


class AIMessageRequest(BaseModel):
    message: str
    history: list[HistoryMessage] = []
    conversation_id: str | None = None


STUDENT_SYSTEM_BASE = (
    "You are a Socratic tutor. Guide the student to discover answers "
    "through questions rather than giving direct answers. Be encouraging "
    "and patient. Keep responses concise (2-4 sentences)."
)

TUTOR_SYSTEM = (
    "You are a helpful assistant for tutors. Help with lesson planning, "
    "teaching strategies, and administrative tasks. Keep responses concise."
)


async def _build_student_prompt(db: AsyncSession, account_id) -> str:
    from app.models.student import StudentProfile, StudentSubject
    from app.models.subject import Subject, EducationLevel

    result = await db.execute(
        select(StudentProfile)
        .options(
            selectinload(StudentProfile.education_level),
            selectinload(StudentProfile.subjects),
        )
        .where(StudentProfile.account_id == account_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return STUDENT_SYSTEM_BASE

    context_parts = []

    if profile.education_level:
        context_parts.append(f"Education level: {profile.education_level.name}")

    if profile.subjects:
        subj_ids = [s.subject_id for s in profile.subjects]
        if subj_ids:
            subj_result = await db.execute(
                select(Subject).where(Subject.id.in_(subj_ids))
            )
            subj_names = [s.name for s in subj_result.scalars().all()]
            if subj_names:
                context_parts.append(f"Subjects studying: {', '.join(subj_names)}")

    if profile.bio:
        context_parts.append(f"Student bio: {profile.bio}")

    if not context_parts:
        return STUDENT_SYSTEM_BASE

    student_context = "\n".join(context_parts)
    return (
        f"{STUDENT_SYSTEM_BASE}\n\n"
        f"The student you are helping has the following profile:\n{student_context}\n\n"
        "Tailor your responses to their education level and subjects. "
        "Reference their areas of study when relevant. "
        "If they ask about topics outside their listed subjects, still help but "
        "connect explanations to concepts they would be familiar with."
    )


@router.post("/assistant/message")
async def send_message(
    data: AIMessageRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if current_user.account_type not in ("student", "tutor"):
        return {"data": {"response": "AI assistant is available for students and tutors only."}}

    if current_user.account_type == "student":
        system_prompt = await _build_student_prompt(db, current_user.id)
    else:
        system_prompt = TUTOR_SYSTEM

    messages = [{"role": "system", "content": system_prompt}]
    for msg in data.history:
        if msg.role in ("user", "assistant"):
            messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": data.message})

    url = f"{settings.OLLAMA_BASE_URL}/api/chat"
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                url,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False,
                    "keep_alive": -1,
                },
            )
            if response.status_code == 200:
                body = response.json()
                reply = body.get("message", {}).get("content", "")
                if reply:
                    return {"data": {"response": reply}}

            logger.warning("Ollama returned %d: %s", response.status_code, response.text[:200])
    except httpx.ConnectError:
        logger.info("Ollama not reachable at %s", settings.OLLAMA_BASE_URL)
        return {
            "data": {
                "response": (
                    "The AI assistant is currently unavailable. "
                    "Please make sure the Ollama service is running."
                )
            }
        }
    except httpx.ReadTimeout:
        logger.warning("Ollama request timed out — model may still be loading")
        return {
            "data": {
                "response": (
                    "The AI model is still loading. "
                    "Please wait a moment and try again."
                )
            }
        }
    except Exception as e:
        logger.error("Ollama request failed: %s", e)

    return {
        "data": {
            "response": (
                "The AI assistant is currently unavailable. "
                "Please try again in a moment."
            )
        }
    }
