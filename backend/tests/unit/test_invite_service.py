import pytest

from app.schemas.invite import InviteActionRequest


class TestInviteValidation:
    def test_valid_action(self):
        action = InviteActionRequest(note="Sorry, I have a conflict")
        assert action.note == "Sorry, I have a conflict"

    def test_empty_note(self):
        action = InviteActionRequest()
        assert action.note is None
