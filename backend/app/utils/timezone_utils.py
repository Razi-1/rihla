from datetime import datetime, timezone
from zoneinfo import ZoneInfo


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_utc(dt: datetime, tz_name: str) -> datetime:
    if dt.tzinfo is None:
        local_tz = ZoneInfo(tz_name)
        dt = dt.replace(tzinfo=local_tz)
    return dt.astimezone(timezone.utc)


def from_utc(dt: datetime, tz_name: str) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    local_tz = ZoneInfo(tz_name)
    return dt.astimezone(local_tz)
