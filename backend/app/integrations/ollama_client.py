import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def generate(prompt: str, system: str = "", temperature: float = 0.7) -> str:
    url = f"{settings.OLLAMA_BASE_URL}/api/generate"
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                url,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "system": system,
                    "temperature": temperature,
                    "stream": False,
                    "keep_alive": -1,
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
        "You are a search parameter extractor for a tutoring platform in Sri Lanka. "
        "Given a natural language query about finding a tutor, extract structured parameters as JSON.\n\n"
        "Fields to extract (use null if not mentioned):\n"
        "- subject: the academic subject (e.g. \"mathematics\", \"physics\", \"english\", \"computer science\")\n"
        "- gender_preference: \"male\" or \"female\" if specified\n"
        "- mode: \"online\", \"physical\", or \"hybrid\" if specified\n"
        "- budget: maximum price as a number if mentioned\n"
        "- location: city or region name if mentioned (e.g. \"Colombo\", \"Kandy\", \"Galle\")\n"
        "- education_level: e.g. \"O-Level\", \"A-Level\", \"Primary\" if mentioned\n\n"
        "Return ONLY valid JSON, no other text or explanation."
    )
    response = await generate(query, system=system, temperature=0.1)
    try:
        import json
        cleaned = response.strip()
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start >= 0 and end > start:
            cleaned = cleaned[start:end]
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        return {"raw_query": query}
