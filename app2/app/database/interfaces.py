"""Database layer interfaces with two-tier architecture."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from ..core import OperationResult, ErrorCode


class ILowLevelDatabase(ABC):
    """
    Low-level database abstraction for raw operations.

    Handles basic connection, query execution, and housekeeping.
    No business logic — just execute and get results.
    """

    @abstractmethod
    def execute_query(self, action_name: str, payload: dict[str, Any] | None = None) -> OperationResult:
        """Execute a named data action. Returns OperationResult with data or error."""

    @abstractmethod
    def connect(self) -> OperationResult:
        """Open a database connection if required."""

    @abstractmethod
    def disconnect(self) -> OperationResult:
        """Close a database connection if required."""

    @abstractmethod
    def backup(self) -> OperationResult:
        """Create a database backup artifact."""


class IHighLevelDatabase(ABC):
    """
    High-level database operations using ILowLevelDatabase.

    Handles complex queries, transactions, and business-specific data access.
    Uses ILowLevelDatabase internally to maintain separation of concerns.
    """

    @abstractmethod
    def safe_execute(
        self, action_name: str, payload: dict[str, Any] | None = None
    ) -> OperationResult:
        """
        Execute only whitelisted named actions with validation.

        Enforces allowed actions and returns rich OperationResult.
        """


class IUserRepository(ABC):
    """
    User persistence interface (high-level user operations).

    Wraps database operations for finding/creating/managing users.
    All methods return OperationResult with error codes.
    """

    @abstractmethod
    def find_by_email_and_role(self, email: str, role: str) -> OperationResult:
        """
        Find user by email and role.

        Returns OperationResult with User data or NOT_FOUND error.
        """

    @abstractmethod
    def create_user(
        self, email: str, password: str, role: str, check_user_validity: bool = True
    ) -> OperationResult:
        """
        Create and return a user.

        Returns OperationResult with created User or error:
        - DUPLICATE_EMAIL_ROLE if user exists
        - DB_ERROR if creation fails
        """

    @abstractmethod
    def find_by_id(self, user_id: int) -> OperationResult:
        """
        Find user by ID.

        Returns OperationResult with User data or NOT_FOUND error.
        """

    @abstractmethod
    def list_all_users(self) -> list:
        """
        Return all users ordered by role then email.

        Returns list of UserORM instances.
        """

    @abstractmethod
    def update_user_role(self, user_id: int, new_role: str):
        """
        Update a user's role.

        Returns updated UserORM on success or None if not found / error.
        """


class IApplicationRepository(ABC):
    """
    Application persistence interface (high-level application operations).

    Wraps database operations for finding/creating/managing applications.
    All methods return OperationResult with error codes.
    """

    @abstractmethod
    def find_by_id(self, application_id: int) -> OperationResult:
        """
        Find application by ID.

        Returns OperationResult with Application data or NOT_FOUND error.
        """

    @abstractmethod
    def update(self, application: Any) -> OperationResult:
        """
        Update entire application object and commit.

        Returns OperationResult with updated Application or error.
        """

    @abstractmethod
    def add_to_session(self, application: Any) -> OperationResult:
        """
        Add application to session without committing (for batch operations).

        Returns OperationResult or error.
        """

    @abstractmethod
    def commit() -> OperationResult:
        """
        Commit pending changes to database.

        Returns OperationResult or error.
        """

    @abstractmethod
    def rollback() -> OperationResult:
        """
        Rollback pending changes.

        Returns OperationResult or error.
        """

    @abstractmethod
    def get_by_status(self, status: str) -> OperationResult:
        """
        Get all applications with a specific status.

        Returns OperationResult with list of Applications or error.
        """

    @abstractmethod
    def get_document(self, doc_id: int) -> OperationResult:
        """
        Get document by ID.

        Returns OperationResult with ApplicationDocument or DOCUMENT_NOT_FOUND error.
        """

    @abstractmethod
    def add_document(self, document: Any) -> OperationResult:
        """
        Add a single document to session without committing.

        Returns OperationResult or error.
        """

    @abstractmethod
    def add_documents(self, documents: list[Any]) -> OperationResult:
        """
        Add multiple documents to session without committing.

        Returns OperationResult or error.
        """

    @abstractmethod
    def delete_document(self, document: Any) -> OperationResult:
        """
        Delete a single document from session without committing.

        Returns OperationResult or error.
        """


# Legacy aliases (deprecated, kept for backward compatibility during migration)
DatabaseInterface = ILowLevelDatabase
DatabaseControlInterface = IHighLevelDatabase
UserDataInterface = IUserRepository
