import pytest
from decimal import Decimal

from app.schemas.search import AISearchRequest, SearchFilters


class TestSearchFilters:
    def test_default_filters(self):
        filters = SearchFilters()
        assert filters.limit == 20
        assert filters.cursor is None

    def test_mode_validation(self):
        filters = SearchFilters(mode="online")
        assert filters.mode == "online"

    def test_invalid_mode(self):
        with pytest.raises(Exception):
            SearchFilters(mode="invalid")


class TestAISearch:
    def test_valid_query(self):
        req = AISearchRequest(query="find me a math tutor near Colombo")
        assert "math" in req.query

    def test_query_too_short(self):
        with pytest.raises(Exception):
            AISearchRequest(query="hi")
