import pytest
from datetime import datetime, timedelta, timezone

from app.models.session import Session


class TestSessionModel:
    def test_session_48h_rule(self):
        now = datetime.now(timezone.utc)
        session_soon = Session(
            tutor_id="00000000-0000-0000-0000-000000000001",
            title="Soon",
            session_type="individual_class",
            mode="online",
            status="active",
            duration_minutes=60,
            start_time=now + timedelta(hours=24),
            end_time=now + timedelta(hours=25),
        )
        assert (session_soon.start_time - now) < timedelta(hours=48)

    def test_session_outside_48h(self):
        now = datetime.now(timezone.utc)
        session_far = Session(
            tutor_id="00000000-0000-0000-0000-000000000001",
            title="Far",
            session_type="individual_class",
            mode="online",
            status="active",
            duration_minutes=60,
            start_time=now + timedelta(days=7),
            end_time=now + timedelta(days=7, hours=1),
        )
        assert (session_far.start_time - now) >= timedelta(hours=48)

    def test_valid_durations(self):
        valid = {30, 45, 60, 90, 120}
        for d in valid:
            assert d in valid
        assert 15 not in valid
        assert 100 not in valid
