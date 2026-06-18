"""YDYO role class."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

from ...core import OperationResult, ErrorCode
from ...database import get_application_repository
from ..interfaces import IReviewer
from .base import User

if TYPE_CHECKING:
    from ...services.document_checker import IDocumentChecker


class Ydyo(User, IReviewer):
    """YDYO role."""

    def get_pending_applicants(self) -> list:
        """Get pending applications."""
        return self.get_applications()

    def update_applicant_status(self, applicant_id: int, status: str) -> OperationResult:
        """Update applicant status. Returns OperationResult."""
        if applicant_id <= 0 or not status:
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                "Invalid applicant ID or status."
            )
        return OperationResult.ok()

    def get_applications(self) -> list:
        """Get applications forwarded to YDYO."""
        app_repo = get_application_repository()
        result = app_repo.get_pending_for_ydyo()
        if result.success:
            return result.data or []
        return []

    def get_document(self, doc_id: int) -> OperationResult:
        """Get document. Returns OperationResult."""
        app_repo = get_application_repository()
        return app_repo.get_document(doc_id)

    _VALID_PREP_STATUSES = {"eligible", "needs_test"}

    def mark_and_forward(self, application_id: int, prep_status: str) -> OperationResult:
        """Set prep school status and forward to Dean. Returns OperationResult."""
        app_repo = get_application_repository()

        if prep_status not in self._VALID_PREP_STATUSES:
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                f"Invalid prep school status. Must be one of {self._VALID_PREP_STATUSES}."
            )

        try:
            # Get application
            result = app_repo.find_by_id(application_id)
            if not result.success:
                return result
            if result.data is None:
                return OperationResult.error(
                    ErrorCode.APPLICATION_NOT_FOUND,
                    f"Application {application_id} not found."
                )

            app = result.data
            if app.status != "forwarded_to_ydyo":
                return OperationResult.error(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    f"Cannot process application in status '{app.status}'."
                )

            # Update and commit
            app.prep_school_status = prep_status
            app.status = "forwarded_to_dean"
            commit_result = app_repo.update(app)
            return commit_result
        except Exception as exc:
            app_repo.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to process application: {str(exc)}"
            )

    def forward_all_to_dean(self) -> OperationResult:
        """Forward all forwarded_to_ydyo applications to Dean without document checking."""
        app_repo = get_application_repository()
        try:
            result = app_repo.get_by_status("forwarded_to_ydyo")
            if not result.success:
                return result

            apps = result.data or []
            count = len(apps)
            for app in apps:
                app.prep_school_status = "eligible"
                app.status = "forwarded_to_dean"
                add_result = app_repo.add_to_session(app)
                if not add_result.success:
                    app_repo.rollback()
                    return add_result

            commit_result = app_repo.commit()
            if commit_result.success:
                commit_result.data = {"forwarded_count": count}
            return commit_result
        except Exception as exc:
            app_repo.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to forward applications: {str(exc)}"
            )

    def auto_check_and_forward_all(self, checker: "IDocumentChecker | None" = None) -> OperationResult:
        """
        Run document checker on every forwarded_to_ydyo application, store results, and
        forward those that pass (marking them eligible) to the Dean.
        Applications with errors stay in 'forwarded_to_ydyo' but are auto_checked.

        Args:
            checker: IDocumentChecker implementation.  Defaults to MockDocumentChecker.
        """
        if checker is None:
            from ...services.document_checker import MockDocumentChecker
            checker = MockDocumentChecker()

        app_repo = get_application_repository()
        try:
            result = app_repo.get_by_status_with_documents("forwarded_to_ydyo")
            if not result.success:
                return result

            apps = result.data or []
            forwarded = 0
            flagged = 0

            for app in apps:
                check_result = checker.check_application(app)
                app.doc_checker_status = "auto_checked"
                app.doc_checker_errors = json.dumps(
                    [e.to_dict() for e in check_result.errors]
                )

                if check_result.passed:
                    app.prep_school_status = "eligible"
                    app.status = "forwarded_to_dean"
                    forwarded += 1
                else:
                    flagged += 1

                add_result = app_repo.add_to_session(app)
                if not add_result.success:
                    app_repo.rollback()
                    return add_result

            commit_result = app_repo.commit()
            if commit_result.success:
                commit_result.data = {"forwarded": forwarded, "flagged": flagged}
            return commit_result
        except Exception as exc:
            app_repo.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Auto-check failed: {str(exc)}"
            )

    def set_prepschool_status(self) -> OperationResult:
        """Set prep school status. Returns OperationResult."""
        return OperationResult.ok()
