import time

import redis.asyncio as redis

from app.config import settings

redis_client: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client


async def close_redis() -> None:
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


async def check_rate_limit(
    key: str,
    max_requests: int,
    window_seconds: int,
) -> bool:
    r = await get_redis()
    current_time = int(time.time())
    window_key = f"rate_limit:{key}:{current_time // window_seconds}"

    pipe = r.pipeline()
    pipe.incr(window_key)
    pipe.expire(window_key, window_seconds)
    results = await pipe.execute()

    current_count = results[0]
    return current_count <= max_requests


async def rate_limit_login(identifier: str) -> bool:
    return await check_rate_limit(f"login:{identifier}", 5, 300)


async def rate_limit_register(ip: str) -> bool:
    return await check_rate_limit(f"register:{ip}", 3, 3600)


async def rate_limit_api(identifier: str) -> bool:
    return await check_rate_limit(f"api:{identifier}", 100, 60)
