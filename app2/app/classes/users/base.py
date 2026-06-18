"""Base user class."""

from __future__ import annotations

from abc import ABC


class User(ABC):
    """Abstract system user."""

    def __init__(self, user_id: int, email: str, role: str) -> None:
        self.user_id = user_id
        self.email = email
        self.role = role

    def get_id(self) -> int:
        """Get user ID."""
        return self.user_id
