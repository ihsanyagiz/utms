"""Authentication service - orchestrates user authentication."""

from __future__ import annotations

from ..classes.auth import AuthClass
from ..core import ErrorCode, OperationResult
from .base_service import BaseService


class AuthService(BaseService):
    """Service for authentication operations."""

    def __init__(self):
        """Initialize AuthService."""
        self.auth = AuthClass()

    def login(self, email: str, password: str, role: str = "") -> OperationResult:
        """
        Authenticate user with email and password.
        
        Args:
            email: User's email
            password: User's password
            role: Optional role restriction
        
        Returns:
            OperationResult with User data on success
        """
        email = (email or "").strip().lower()
        password = password or ""

        # Validate inputs
        validation_error = self.validate_required_fields(
            {"email": email, "password": password},
            ["email", "password"]
        )
        if validation_error:
            return validation_error

        # Authenticate via auth class (which uses repository)
        return self.auth.authenticate_user(email, password, role)

    def register(
        self,
        email: str,
        password: str,
        password_confirm: str,
        role: str = "applicant",
        check_validity: bool = False,
    ) -> OperationResult:
        """
        Register new user.
        
        Args:
            email: User's email
            password: User's password
            password_confirm: Password confirmation
            role: User's role
            check_validity: Whether to check user validity
        
        Returns:
            OperationResult with success/error
        """
        email = (email or "").strip().lower()
        password = password or ""
        password_confirm = password_confirm or ""

        # Validate inputs
        validation_error = self.validate_required_fields(
            {"email": email, "password": password, "password_confirm": password_confirm},
            ["email", "password", "password_confirm"]
        )
        if validation_error:
            return validation_error

        # Check password match
        if password != password_confirm:
            return self.error(
                ErrorCode.VALIDATION_FAILED,
                "Passwords do not match"
            )

        # Register via auth class
        return self.auth.register_user(
            email=email,
            password=password,
            role=role,
            check_user_validity=check_validity
        )

    def validate_credentials(self, email: str, password: str) -> OperationResult:
        """
        Validate email and password format.
        
        Args:
            email: Email to validate
            password: Password to validate
        
        Returns:
            OperationResult with validation result
        """
        email = (email or "").strip().lower()
        password = password or ""

        return self.auth.validate_credentials(email, password)

    def request_password_reset(self, email: str) -> OperationResult:
        """
        Request password reset for user.
        
        Args:
            email: User's email
        
        Returns:
            OperationResult with reset details
        """
        email = (email or "").strip().lower()

        if not email:
            return self.error(
                ErrorCode.VALIDATION_FAILED,
                "Email is required"
            )

        return self.auth.request_password_reset(email)

    def reset_password(self, token: str, new_password: str, confirm_password: str) -> OperationResult:
        """
        Reset password using token.
        
        Args:
            token: Password reset token
            new_password: New password
            confirm_password: Password confirmation
        
        Returns:
            OperationResult with success/error
        """
        if new_password != confirm_password:
            return self.error(
                ErrorCode.VALIDATION_FAILED,
                "Passwords do not match"
            )

        return self.auth.reset_password(token, new_password)

    def login_with_edevlet(self, code: str, state: str) -> OperationResult:
        """
        Login using e-Devlet OAuth.
        
        Args:
            code: Authorization code from e-Devlet
            state: State parameter for CSRF protection
        
        Returns:
            OperationResult with user data
        """
        return self.auth.login_with_edevlet(code, state)

    def send_confirmation_email(self, user_id: int) -> OperationResult:
        """
        Send confirmation email to user.
        
        Args:
            user_id: User's ID
        
        Returns:
            OperationResult with success/error
        """
        return self.auth.send_confirmation_email(user_id)
