import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def generate(prompt: str, system: str = "", temperature: float = 0.7) -> str:
    url = f"{settings.OLLAMA_BASE_URL}/api/generate"
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "system": system,
                    "temperature": temperature,
                    "stream": False,
                },
            )
            if response.status_code == 200:
                return response.json().get("response", "")
            logger.error("Ollama returned %d: %s", response.status_code, response.text)
            return ""
    except Exception as e:
        logger.error("Ollama request failed: %s", e)
        return ""


async def extract_search_params(query: str) -> dict:
    system = (
        "You are a search parameter extractor. Given a natural language query about finding a tutor, "
        "extract structured parameters as JSON with fields: subject, topic, gender_preference, mode, "
        "availability, budget, qualitative_notes. Return ONLY valid JSON, no other text."
    )
    response = await generate(query, system=system, temperature=0.1)
    try:
        import json
        return json.loads(response)
    except (json.JSONDecodeError, ValueError):
        return {"raw_query": query}
