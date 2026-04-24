from app.integrations.ollama_client import extract_search_params


async def extract_from_query(query: str) -> dict:
    return await extract_search_params(query)
