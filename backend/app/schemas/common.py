from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel):
    data: Any = None
    message: str = "Success"


class ErrorResponse(BaseModel):
    detail: str
    code: str
    errors: dict[str, Any] | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    next_cursor: str | None = None
    has_more: bool = False
    total: int | None = None
