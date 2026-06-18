"""Abstract interfaces for shared domain behaviors."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from ..core import OperationResult


class IReviewer(ABC):
    """Shared applicant review behaviors across reviewer roles."""

    @abstractmethod
    def get_pending_applicants(self) -> list:
        """Return pending applicants for the reviewer."""

    @abstractmethod
    def update_applicant_status(self, applicant_id: int, status: str) -> OperationResult:
        """Update applicant review status. Returns OperationResult."""


class IDocumentHandler(ABC):
    """Shared document handling behaviors."""

    @abstractmethod
    def upload(self, payload: dict[str, Any]) -> OperationResult:
        """Handle document upload action. Returns OperationResult."""

    @abstractmethod
    def validate(self, document_id: int) -> OperationResult:
        """Validate uploaded document. Returns OperationResult."""

    @abstractmethod
    def retrieve(self, applicant_id: int) -> OperationResult:
        """Retrieve documents for applicant. Returns OperationResult."""
