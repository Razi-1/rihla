from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(
        self,
        detail: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    ):
        self.detail = detail
        self.code = code
        self.status_code = status_code


class NotFoundError(AppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            detail=detail,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ConflictError(AppException):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(
            detail=detail,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
        )


class ForbiddenError(AppException):
    def __init__(self, detail: str = "Access denied"):
        super().__init__(
            detail=detail,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class UnauthorizedError(AppException):
    def __init__(self, detail: str = "Authentication required"):
        super().__init__(
            detail=detail,
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class ValidationError(AppException):
    def __init__(self, detail: str = "Validation failed", errors: dict | None = None):
        super().__init__(
            detail=detail,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
        self.errors = errors


class RateLimitError(AppException):
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(
            detail=detail,
            code="RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )


class AccountRestrictedError(AppException):
    def __init__(self):
        super().__init__(
            detail="Your account has been restricted. Contact support for more information.",
            code="ACCOUNT_RESTRICTED",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class EmailNotVerifiedError(AppException):
    def __init__(self):
        super().__init__(
            detail="Please verify your email address to perform this action.",
            code="EMAIL_NOT_VERIFIED",
            status_code=status.HTTP_403_FORBIDDEN,
        )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    content = {"detail": exc.detail, "code": exc.code}
    if isinstance(exc, ValidationError) and exc.errors:
        content["errors"] = exc.errors
    return JSONResponse(status_code=exc.status_code, content=content)


async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": "HTTP_ERROR"},
    )


async def generic_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred.", "code": "INTERNAL_ERROR"},
    )
