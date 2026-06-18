"""Business logic services layer.

Services orchestrate operations between repositories and routes.
All service methods return OperationResult with error codes.
"""

from .application_service import ApplicationService
from .auth_service import AuthService
from .user_service import UserService


def get_application_service(user_id: int) -> ApplicationService:
    """Get ApplicationService for given user."""
    return ApplicationService(user_id)


def get_auth_service() -> AuthService:
    """Get AuthService."""
    return AuthService()


def get_user_service(user_id: int) -> UserService:
    """Get UserService for given user."""
    return UserService(user_id)


__all__ = [
    "ApplicationService",
    "AuthService",
    "UserService",
    "get_application_service",
    "get_auth_service",
    "get_user_service",
]
