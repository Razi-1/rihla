import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.models.session import RecurrenceRule, Session

logger = logging.getLogger(__name__)

HORIZON_MONTHS = 3


async def generate_recurring_sessions():
    """Pre-generate recurring session occurrences on a rolling 3-month horizon."""
    async with async_session_factory() as db:
        try:
            result = await db.execute(
                select(RecurrenceRule)
                .join(Session, RecurrenceRule.session_id == Session.id)
                .where(Session.status == "active")
            )
            rules = result.scalars().all()

            generated = 0
            horizon = datetime.now(timezone.utc) + timedelta(days=90)

            for rule in rules:
                root_session = await db.get(Session, rule.session_id)
                if not root_session:
                    continue

                existing = await db.execute(
                    select(Session.start_time).where(
                        Session.series_root_id == root_session.id
                    )
                )
                existing_times = {row[0] for row in existing.all()}

                current = root_session.start_time
                while current < horizon:
                    if rule.frequency == "weekly":
                        current += timedelta(weeks=1)
                    elif rule.frequency == "biweekly":
                        current += timedelta(weeks=2)
                    elif rule.frequency == "monthly":
                        current += timedelta(days=30)

                    if current > horizon or current.date() > rule.end_date:
                        break

                    if current in existing_times:
                        continue

                    if current.weekday() not in rule.days_of_week:
                        continue

                    occurrence = Session(
                        tutor_id=root_session.tutor_id,
                        title=root_session.title,
                        session_type=root_session.session_type,
                        mode=root_session.mode,
                        status="active",
                        location_address=root_session.location_address,
                        location_city=root_session.location_city,
                        location_region=root_session.location_region,
                        location_country=root_session.location_country,
                        duration_minutes=root_session.duration_minutes,
                        start_time=current,
                        end_time=current + timedelta(minutes=root_session.duration_minutes),
                        series_root_id=root_session.id,
                        max_group_size=root_session.max_group_size,
                        jitsi_room_name=root_session.jitsi_room_name,
                    )
                    db.add(occurrence)
                    generated += 1

            await db.commit()
            logger.info("Generated %d recurring session occurrences", generated)
        except Exception as e:
            await db.rollback()
            logger.error("Session generation failed: %s", e)
