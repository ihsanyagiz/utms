"""YGK role class."""

from __future__ import annotations

from flask import session

from ...core import ErrorCode, OperationResult
from ...database import get_application_repository, get_intibak_repository
from ..interfaces import IReviewer
from .base import User


class YGK(User, IReviewer):
    """YGK reviewer — handles intibak (course equivalency) evaluation."""

    def get_pending_applicants(self) -> list:
        """Get forwarded_to_ygk applications filtered to this user's department."""
        app_repo = get_application_repository()
        result = app_repo.get_pending_for_ygk()
        if not result.success:
            return []
        apps = result.data or []
        dept = session.get("user_department")
        if dept:
            apps = [a for a in apps if a.forwarded_faculty == dept]
        return apps

    def update_applicant_status(self, applicant_id: int, status: str) -> OperationResult:
        if applicant_id <= 0 or not status:
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED, "Invalid applicant ID or status."
            )
        app_repo = get_application_repository()
        return app_repo.update_status(applicant_id, status)

    # ── Intibak table operations ──

    def get_intibak_table(self, application_id: int) -> OperationResult:
        """Get or create the intibak table for an application."""
        intibak_repo = get_intibak_repository()
        return intibak_repo.get_or_create_table(application_id)

    def add_course(self, application_id: int, side: str, course_data: dict) -> OperationResult:
        """Add a course row to the intibak table for an application."""
        intibak_repo = get_intibak_repository()
        table_result = intibak_repo.get_or_create_table(application_id)
        if not table_result.success:
            return table_result
        return intibak_repo.add_course(table_result.data.id, side, course_data)

    def delete_course(self, course_id: int) -> OperationResult:
        """Remove a course row from an intibak table."""
        intibak_repo = get_intibak_repository()
        return intibak_repo.delete_course(course_id)

    def update_course_grade(self, course_id: int, grade: str) -> OperationResult:
        """Update the grade on a single intibak course row."""
        intibak_repo = get_intibak_repository()
        return intibak_repo.update_course_grade(course_id, grade)

    def approve_for_oidb(self, application_id: int, ranking_score: float | None) -> OperationResult:
        """Save ranking score and forward application back to OIDB."""
        intibak_repo = get_intibak_repository()
        table_result = intibak_repo.get_or_create_table(application_id)
        if not table_result.success:
            return table_result
        save_result = intibak_repo.save_ranking_score(table_result.data.id, ranking_score)
        if not save_result.success:
            return save_result
        app_repo = get_application_repository()
        return app_repo.update_status(application_id, "intibak_complete")

    def get_document(self, doc_id: int) -> OperationResult:
        """Retrieve an application document by ID (for transcript viewing)."""
        app_repo = get_application_repository()
        return app_repo.get_document(doc_id)

    # ── Legacy stubs (kept for IReviewer contract) ──

    def create_intibak_table(self) -> OperationResult:
        return OperationResult.ok()

    def edit_course_match(self) -> OperationResult:
        return OperationResult.ok()

    def save_intibak_table(self) -> OperationResult:
        return OperationResult.ok()
