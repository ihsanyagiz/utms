"""Rich result objects with error codes for all business operations."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class ErrorCode(Enum):
    """Centralized error codes for all operations."""

    # Validation errors
    VALIDATION_FAILED = "VALIDATION_FAILED"
    INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT"
    INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION"
    GPA_OUT_OF_RANGE = "GPA_OUT_OF_RANGE"
    MISSING_REQUIRED_FIELDS = "MISSING_REQUIRED_FIELDS"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"

    # Not found errors
    NOT_FOUND = "NOT_FOUND"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND"
    DOCUMENT_NOT_FOUND = "DOCUMENT_NOT_FOUND"

    # Conflict errors
    DUPLICATE = "DUPLICATE"
    USER_EXISTS = "USER_EXISTS"
    APPLICATION_EXISTS = "APPLICATION_EXISTS"
    DUPLICATE_EMAIL_ROLE = "DUPLICATE_EMAIL_ROLE"

    # System errors
    FILE_NOT_SAVED = "FILE_NOT_SAVED"
    FILE_NOT_UPLOADED = "FILE_NOT_UPLOADED"
    DB_ERROR = "DB_ERROR"
    DB_INTEGRITY_ERROR = "DB_INTEGRITY_ERROR"
    INVALID_TRANSITION = "INVALID_TRANSITION"
    PERMISSION_DENIED = "PERMISSION_DENIED"

    # Unknown
    UNKNOWN_ERROR = "UNKNOWN_ERROR"


@dataclass
class OperationResult(Generic[T]):
    """
    Rich result object for all business operations.

    Encapsulates success/failure with typed data, error codes, and messages.
    Enables clear error handling, testing, and analytics.

    Example:
        result = user_service.create_user(email, password, role)
        if result.success:
            user = result.data
            logger.info(f"User created: {user.id}")
        else:
            logger.error(f"User creation failed: {result.error_code.value}")
            if result.is_error(ErrorCode.DUPLICATE_EMAIL_ROLE):
                flash("Email already registered for this role")
            else:
                flash(result.error_msg)
    """

    success: bool
    data: T | None = None
    error_code: ErrorCode | None = None
    error_msg: str = ""

    @classmethod
    def ok(cls, data: T | None = None) -> OperationResult[T]:
        """Create a success result with optional data."""
        return cls(success=True, data=data)

    @classmethod
    def error(
        cls, code: ErrorCode, msg: str, data: T | None = None
    ) -> OperationResult[T]:
        """Create an error result with error code and message."""
        return cls(success=False, error_code=code, error_msg=msg, data=data)

    def is_success(self) -> bool:
        """Check if operation succeeded."""
        return self.success

    def is_error(self, code: ErrorCode) -> bool:
        """Check if operation failed with a specific error code."""
        return not self.success and self.error_code == code

    def __bool__(self) -> bool:
        """Allow using result in boolean context: if result: ..."""
        return self.success
