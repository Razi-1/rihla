import pytest

from app.schemas.parent import LinkChildRequest, PermissionToggleRequest


class TestParentSchemas:
    def test_link_child_request(self):
        req = LinkChildRequest(student_email="child@test.com")
        assert req.student_email == "child@test.com"

    def test_permission_toggle_granted(self):
        req = PermissionToggleRequest(status="granted")
        assert req.status == "granted"

    def test_permission_toggle_denied(self):
        req = PermissionToggleRequest(status="denied")
        assert req.status == "denied"

    def test_permission_toggle_invalid(self):
        with pytest.raises(Exception):
            PermissionToggleRequest(status="invalid")
