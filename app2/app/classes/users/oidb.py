"""OIDB role class."""

from __future__ import annotations

import json
from typing import Any, TYPE_CHECKING

from ...core import OperationResult, ErrorCode
from ...database import get_application_repository
from ..interfaces import IReviewer, IDocumentHandler
from .base import User

if TYPE_CHECKING:
    from ...services.document_checker import IDocumentChecker


class Oidb(User, IReviewer, IDocumentHandler):
    """OIDB role."""

    def get_pending_applicants(self) -> list:
        """Get pending applications."""
        app_repo = get_application_repository()
        result = app_repo.get_pending_for_oidb()
        if result.success:
            return result.data or []
        return []

    def update_applicant_status(self, application_id: int, status: str) -> OperationResult:
        """Update application status. Returns OperationResult."""
        app_repo = get_application_repository()
        return app_repo.update_status(application_id, status)

    def forward_to_ydyo(self, application_id: int) -> OperationResult:
        """Forward application to YDYO. Returns OperationResult."""
        app_repo = get_application_repository()

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
            if app.status not in ("submitted", "returned"):
                return OperationResult.error(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    f"Cannot forward from status '{app.status}'."
                )

            # Update and commit
            app.status = "forwarded_to_ydyo"
            commit_result = app_repo.update(app)
            return commit_result
        except Exception as exc:
            app_repo.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to forward application: {str(exc)}"
            )

    def forward_all_to_ydyo(self) -> OperationResult:
        """Forward all submitted applications to YDYO without document checking."""
        app_repo = get_application_repository()

        try:
            result = app_repo.get_by_status("submitted")
            if not result.success:
                return result

            apps = result.data or []
            count = len(apps)

            for app in apps:
                app.status = "forwarded_to_ydyo"
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

    def run_doc_checker_all(self, checker: "IDocumentChecker | None" = None) -> OperationResult:
        """Run document checker on every submitted application and store results.
        Does NOT forward — only updates doc_checker_status and doc_checker_errors."""
        if checker is None:
            from ...services.document_checker import MockDocumentChecker
            checker = MockDocumentChecker()

        app_repo = get_application_repository()
        try:
            result = app_repo.get_by_status_with_documents("submitted")
            if not result.success:
                return result

            apps = result.data or []
            passed = 0
            flagged = 0

            for app in apps:
                check_result = checker.check_application(app)
                app.doc_checker_status = "auto_checked"
                app.doc_checker_errors = json.dumps(
                    [e.to_dict() for e in check_result.errors]
                )
                if check_result.passed:
                    passed += 1
                else:
                    flagged += 1

                add_result = app_repo.add_to_session(app)
                if not add_result.success:
                    app_repo.rollback()
                    return add_result

            commit_result = app_repo.commit()
            if commit_result.success:
                commit_result.data = {"passed": passed, "flagged": flagged}
            return commit_result
        except Exception as exc:
            app_repo.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Document check failed: {str(exc)}"
            )

    def auto_forward_checked(self) -> OperationResult:
        """Forward all submitted applications where doc checker already passed.
        Does NOT re-run the checker — skips apps not yet checked or with errors."""
        app_repo = get_application_repository()
        try:
            result = app_repo.get_by_status_with_documents("submitted")
            if not result.success:
                return result

            apps = result.data or []
            forwarded = 0
            skipped = 0

            for app in apps:
                if app.doc_checker_status == "auto_checked" and not app.parsed_checker_errors:
                    app.status = "forwarded_to_ydyo"
                    forwarded += 1
                    add_result = app_repo.add_to_session(app)
                    if not add_result.success:
                        app_repo.rollback()
                        return add_result
                else:
                    skipped += 1

            commit_result = app_repo.commit()
            if commit_result.success:
                commit_result.data = {"forwarded": forwarded, "skipped": skipped}
            return commit_result
        except Exception as exc:
            app_repo.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Auto-forward failed: {str(exc)}"
            )

    def auto_check_and_forward_all(self, checker: "IDocumentChecker | None" = None) -> OperationResult:
        """
        Run document checker on every submitted application, store results, and
        forward those that pass.  Applications with errors stay in 'submitted' status
        but are marked doc_checker_status='auto_checked' so the UI can show the errors.

        Args:
            checker: IDocumentChecker implementation.  Defaults to MockDocumentChecker.
        """
        if checker is None:
            from ...services.document_checker import MockDocumentChecker
            checker = MockDocumentChecker()

        app_repo = get_application_repository()
        try:
            result = app_repo.get_by_status_with_documents("submitted")
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
                    app.status = "forwarded_to_ydyo"
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

    def return_application(self, application_id: int, notes: str) -> OperationResult:
        """Return application to applicant. Returns OperationResult."""
        app_repo = get_application_repository()

        if not notes or not notes.strip():
            return OperationResult.error(
                ErrorCode.MISSING_REQUIRED_FIELDS,
                "A reason is required when returning an application."
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
            if app.status != "submitted":
                return OperationResult.error(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    "Cannot return this application."
                )

            # Update and commit
            app.status = "returned"
            app.oidb_notes = notes
            commit_result = app_repo.update(app)
            return commit_result
        except Exception as exc:
            app_repo.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to return application: {str(exc)}"
            )

    def cancel_forward_to_ydyo(self, application_id: int) -> OperationResult:
        """Revert forwarded_to_ydyo back to submitted. Only allowed while YDYO hasn't acted yet."""
        app_repo = get_application_repository()
        try:
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
                    f"Cannot cancel: application status is '{app.status}'. Cancellation is only possible while still forwarded to YDYO."
                )
            app.status = "submitted"
            return app_repo.update(app)
        except Exception as exc:
            app_repo.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to cancel forward: {str(exc)}"
            )

    def get_document(self, doc_id: int) -> OperationResult:
        """Get document. Returns OperationResult."""
        app_repo = get_application_repository()
        return app_repo.get_document(doc_id)

    def upload(self, payload: dict[str, Any]) -> OperationResult:
        """Upload document. Returns OperationResult."""
        if not payload:
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                "Payload cannot be empty."
            )
        return OperationResult.ok(data=payload)

    def validate(self, document_id: int) -> OperationResult:
        """Validate document. Returns OperationResult."""
        if document_id <= 0:
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                "Document ID must be positive."
            )
        return OperationResult.ok()

    def retrieve(self, applicant_id: int) -> OperationResult:
        """Retrieve applicant documents. Returns OperationResult."""
        return OperationResult.ok(data=self.get_pending_applicants())
