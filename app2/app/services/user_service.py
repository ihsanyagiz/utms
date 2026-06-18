"""User service - orchestrates user-related operations."""

from __future__ import annotations

from ..database import get_user_data_interface
from ..core import OperationResult
from .base_service import BaseService


class UserService(BaseService):
    """Service for user operations."""

    def __init__(self, user_id: int):
        """
        Initialize UserService.
        
        Args:
            user_id: Current user's ID
        """
        self.user_id = user_id
        self.user_repo = get_user_data_interface()

    def get_profile(self) -> OperationResult:
        """
        Get current user's profile.
        
        Returns:
            OperationResult with user data
        """
        return self.user_repo.find_by_id(self.user_id)

    def update_profile(self, **kwargs) -> OperationResult:
        """
        Update current user's profile.
        
        Args:
            **kwargs: Profile fields to update
        
        Returns:
            OperationResult with success/error
        """
        # Placeholder - full implementation in Phase 2
        return self.ok({"message": "Profile updated successfully"})
