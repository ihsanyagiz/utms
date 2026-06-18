"""Base service class with shared helpers."""

from __future__ import annotations

from ..core import ErrorCode, OperationResult


class BaseService:
    """Base service with shared helper methods."""

    @staticmethod
    def error(code: ErrorCode, msg: str) -> OperationResult:
        """Create error OperationResult with user-friendly message."""
        return OperationResult.error(code, msg)

    @staticmethod
    def ok(data: dict | list | object | None = None) -> OperationResult:
        """Create success OperationResult with data."""
        return OperationResult.ok(data=data)

    @staticmethod
    def validate_required_fields(data: dict, required: list[str]) -> OperationResult | None:
        """
        Validate that all required fields are present and non-empty.
        
        Args:
            data: Dictionary to validate
            required: List of required field names
        
        Returns:
            OperationResult with error if validation fails, None if all valid
        """
        missing = [field for field in required if not data.get(field, "").strip()]
        
        if missing:
            field_names = ", ".join(missing)
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                f"Required fields missing: {field_names}"
            )
        
        return None
