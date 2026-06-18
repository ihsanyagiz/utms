"""Authentication business logic class."""

from __future__ import annotations

from typing import Any

from ..core import OperationResult, ErrorCode
from ..database import get_user_data_interface


class AuthClass:
    """Encapsulates authentication use cases."""

    def validate_credentials(
        self,
        email: str,
        password: str,
        role: str | None = None,
        valid_roles: set[str] | None = None,
    ) -> OperationResult:
        """Validate that credentials fields are present and role is valid."""
        if not email or not password:
            return OperationResult.error(
                ErrorCode.MISSING_REQUIRED_FIELDS,
                "Email and password are required."
            )
        if role is not None and valid_roles is not None and role not in valid_roles:
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                "Invalid role selected."
            )
        return OperationResult.ok()

    def authenticate_user(self, email: str, password: str, role: str) -> OperationResult:
        """Authenticate user with email and password. Returns OperationResult with User."""
        try:
            user_data = get_user_data_interface()
            user = user_data.find_by_email_role(email=email, role=role)
            if user and user.check_password(password):
                return OperationResult.ok(data=user)
            return OperationResult.error(
                ErrorCode.INVALID_CREDENTIALS,
                "Invalid email or password."
            )
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Authentication failed: {str(exc)}"
            )

    def register_user(
        self, email: str, password: str, role: str, check_user_validity: bool = True
    ) -> OperationResult:
        """Create user if role-scoped email does not exist. Returns OperationResult with User."""
        try:
            user_data = get_user_data_interface()
            if check_user_validity:
                existing_user = user_data.find_by_email_role(email=email, role=role)
                if existing_user:
                    return OperationResult.error(
                        ErrorCode.DUPLICATE_EMAIL_ROLE,
                        f"Email {email} already registered for role {role}."
                    )
            user = user_data.create_user(
                email=email,
                password=password,
                role=role,
                check_user_validity=check_user_validity,
            )
            if user:
                return OperationResult.ok(data=user)
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                "Failed to create user."
            )
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"User registration failed: {str(exc)}"
            )

    def send_confirmation_email(self, email: str) -> OperationResult:
        """Phase 1 placeholder for email confirmation."""
        if not email:
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                "Email is required."
            )
        return OperationResult.ok()

    def request_password_reset(self, email: str) -> OperationResult:
        """Phase 1 placeholder for reset flow."""
        if not email:
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                "Email is required."
            )
        return OperationResult.ok(data={"email": email, "status": "requested"})

    def reset_password(self, email: str, new_password: str) -> OperationResult:
        """Phase 1 placeholder for password reset."""
        if not email or not new_password:
            return OperationResult.error(
                ErrorCode.MISSING_REQUIRED_FIELDS,
                "Email and new password are required."
            )
        return OperationResult.ok()

    def login_with_edevlet(self, token: str) -> OperationResult:
        """Phase 1 placeholder for e-Devlet integration."""
        if not token:
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                "Token is required."
            )
        return OperationResult.error(
            ErrorCode.UNKNOWN_ERROR,
            "e-Devlet integration not yet implemented."
        )
