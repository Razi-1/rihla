import pytest

from app.schemas.review import ReviewCreateRequest


class TestReviewValidation:
    def test_valid_review(self):
        review = ReviewCreateRequest(
            tutor_id="00000000-0000-0000-0000-000000000001",
            rating=5,
            text="This tutor is excellent. Very patient and explains well.",
            sessions_attended=10,
            approximate_duration_weeks=8,
        )
        assert review.rating == 5

    def test_rating_bounds(self):
        with pytest.raises(Exception):
            ReviewCreateRequest(
                tutor_id="00000000-0000-0000-0000-000000000001",
                rating=0,
                text="Bad rating value test here.",
                sessions_attended=1,
                approximate_duration_weeks=1,
            )

        with pytest.raises(Exception):
            ReviewCreateRequest(
                tutor_id="00000000-0000-0000-0000-000000000001",
                rating=6,
                text="Bad rating value test here.",
                sessions_attended=1,
                approximate_duration_weeks=1,
            )

    def test_text_too_short(self):
        with pytest.raises(Exception):
            ReviewCreateRequest(
                tutor_id="00000000-0000-0000-0000-000000000001",
                rating=3,
                text="Short",
                sessions_attended=1,
                approximate_duration_weeks=1,
            )
