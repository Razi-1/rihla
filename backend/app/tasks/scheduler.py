import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.tasks.account_deletion import process_deletions
from app.tasks.age_restriction import check_birthdays
from app.tasks.cleanup import cleanup_expired_tokens
from app.tasks.ml_recomputation import recompute_vectors

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def setup_scheduler() -> None:
    scheduler.add_job(check_birthdays, "cron", hour=0, minute=0)
    scheduler.add_job(process_deletions, "cron", hour=1, minute=0)
    scheduler.add_job(recompute_vectors, "cron", hour=2, minute=0)
    scheduler.add_job(cleanup_expired_tokens, "cron", hour=3, minute=0)
    scheduler.start()
    logger.info("Background scheduler started with 4 daily jobs")
