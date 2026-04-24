import pytest

from app.schemas.attendance import GenerateQRRequest, ValidateQRRequest


class TestAttendanceSchemas:
    def test_generate_qr_request(self):
        req = GenerateQRRequest(
            session_id="00000000-0000-0000-0000-000000000001"
        )
        assert req.session_id is not None

    def test_validate_qr_request(self):
        req = ValidateQRRequest(
            qr_token="test-token-abc",
            session_id="00000000-0000-0000-0000-000000000001",
        )
        assert req.qr_token == "test-token-abc"
