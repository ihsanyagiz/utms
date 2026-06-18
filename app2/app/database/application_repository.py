"""Application data repository - handles all ApplicationORM model operations."""

from __future__ import annotations

from sqlalchemy.orm import selectinload

from .. import db
from ..core import OperationResult, ErrorCode
from ..models import ApplicationORM, ApplicationDocumentORM


class ApplicationRepository:
    """Data access layer for Application operations."""

    @staticmethod
    def find_by_applicant_id(applicant_id: int) -> OperationResult:
        """Find application by applicant ID."""
        try:
            app = ApplicationORM.query.filter_by(applicant_id=applicant_id).first()
            if app:
                return OperationResult.ok(data=app)
            return OperationResult.ok(data=None)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to find application: {str(exc)}"
            )

    @staticmethod
    def find_by_id(application_id: int) -> OperationResult:
        """Find application by ID."""
        try:
            app = ApplicationORM.query.get(application_id)
            if app:
                return OperationResult.ok(data=app)
            return OperationResult.ok(data=None)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to find application: {str(exc)}"
            )

    @staticmethod
    def create(applicant_id: int, **kwargs) -> OperationResult:
        """Create new application."""
        try:
            app = ApplicationORM(applicant_id=applicant_id, **kwargs)
            db.session.add(app)
            db.session.flush()
            return OperationResult.ok(data=app)
        except Exception as exc:
            db.session.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to create application: {str(exc)}"
            )

    @staticmethod
    def update_status(application_id: int, status: str) -> OperationResult:
        """Update application status."""
        try:
            app = ApplicationORM.query.get(application_id)
            if not app:
                return OperationResult.error(
                    ErrorCode.APPLICATION_NOT_FOUND,
                    f"Application {application_id} not found."
                )
            app.status = status
            db.session.commit()
            return OperationResult.ok(data=app)
        except Exception as exc:
            db.session.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to update status: {str(exc)}"
            )

    @staticmethod
    def update(application: ApplicationORM) -> OperationResult:
        """Update entire application object."""
        try:
            db.session.merge(application)
            db.session.commit()
            return OperationResult.ok(data=application)
        except Exception as exc:
            db.session.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to update application: {str(exc)}"
            )

    @staticmethod
    def commit() -> OperationResult:
        """Commit pending changes."""
        try:
            db.session.commit()
            return OperationResult.ok()
        except Exception as exc:
            db.session.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to commit changes: {str(exc)}"
            )

    @staticmethod
    def rollback() -> OperationResult:
        """Rollback pending changes."""
        try:
            db.session.rollback()
            return OperationResult.ok()
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to rollback: {str(exc)}"
            )

    @staticmethod
    def get_pending_for_ygk() -> OperationResult:
        """Get applications forwarded to YGK, with documents and applicant eager-loaded."""
        try:
            apps = (
                ApplicationORM.query.options(
                    selectinload(ApplicationORM.documents),
                    selectinload(ApplicationORM.applicant),
                )
                .filter(ApplicationORM.status.in_(["forwarded_to_ygk", "intibak_complete"]))
                .order_by(ApplicationORM.created_at.desc())
                .all()
            )
            return OperationResult.ok(data=apps)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to fetch YGK applications: {str(exc)}"
            )

    @staticmethod
    def get_pending_for_dean() -> OperationResult:
        """Get applications pending dean review."""
        try:
            apps = (
                ApplicationORM.query.options(
                    selectinload(ApplicationORM.documents),
                    selectinload(ApplicationORM.applicant)
                )
                .filter(ApplicationORM.status.in_(["forwarded_to_dean", "forwarded_to_ygk"]))
                .order_by(ApplicationORM.created_at.desc())
                .all()
            )
            return OperationResult.ok(data=apps)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to fetch pending applications: {str(exc)}"
            )

    @staticmethod
    def get_intibak_complete_apps() -> OperationResult:
        """Get all intibak_complete applications with their ranking data loaded."""
        try:
            from ..models.intibak import IntibakTableORM
            apps = (
                ApplicationORM.query.options(
                    selectinload(ApplicationORM.intibak_table),
                    selectinload(ApplicationORM.applicant),
                )
                .filter_by(status="intibak_complete")
                .order_by(ApplicationORM.created_at.desc())
                .all()
            )
            return OperationResult.ok(data=apps)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to fetch ranking applications: {str(exc)}"
            )

    @staticmethod
    def get_pending_for_oidb() -> OperationResult:
        """Get applications pending OIDB review."""
        try:
            apps = (
                ApplicationORM.query.options(
                    selectinload(ApplicationORM.documents),
                    selectinload(ApplicationORM.applicant)
                )
                .order_by(ApplicationORM.created_at.desc())
                .all()
            )
            return OperationResult.ok(data=apps)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to fetch pending applications: {str(exc)}"
            )

    @staticmethod
    def get_pending_for_ydyo() -> OperationResult:
        """Get applications pending YDYO review."""
        try:
            apps = (
                ApplicationORM.query.options(
                    selectinload(ApplicationORM.documents),
                    selectinload(ApplicationORM.applicant)
                )
                .filter_by(status="forwarded_to_ydyo")
                .order_by(ApplicationORM.created_at.desc())
                .all()
            )
            return OperationResult.ok(data=apps)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to fetch pending applications: {str(exc)}"
            )

    @staticmethod
    def get_all() -> OperationResult:
        """Get all applications (admin use)."""
        try:
            apps = (
                ApplicationORM.query.options(
                    selectinload(ApplicationORM.applicant)
                )
                .order_by(ApplicationORM.created_at.desc())
                .all()
            )
            return OperationResult.ok(data=apps)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to fetch applications: {str(exc)}"
            )

    @staticmethod
    def delete_documents(application_id: int) -> OperationResult:
        """Delete all documents for an application."""
        try:
            docs = ApplicationDocumentORM.query.filter_by(application_id=application_id).all()
            for doc in docs:
                db.session.delete(doc)
            return OperationResult.ok()
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to delete documents: {str(exc)}"
            )

    @staticmethod
    def get_by_status(status: str) -> OperationResult:
        """Get all applications with a specific status."""
        try:
            apps = ApplicationORM.query.filter_by(status=status).all()
            return OperationResult.ok(data=apps)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to fetch applications: {str(exc)}"
            )

    @staticmethod
    def get_by_status_with_documents(status: str) -> OperationResult:
        """Get applications by status with documents and applicant eager-loaded (needed by document checker)."""
        try:
            apps = (
                ApplicationORM.query.options(
                    selectinload(ApplicationORM.documents),
                    selectinload(ApplicationORM.applicant)
                )
                .filter_by(status=status)
                .order_by(ApplicationORM.created_at.desc())
                .all()
            )
            return OperationResult.ok(data=apps)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to fetch applications: {str(exc)}"
            )

    @staticmethod
    def add_to_session(application: ApplicationORM) -> OperationResult:
        """Add application to session without committing (for batch operations)."""
        try:
            db.session.merge(application)
            return OperationResult.ok()
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to add application to session: {str(exc)}"
            )

    @staticmethod
    def get_document(doc_id: int) -> OperationResult:
        """Get document by ID."""
        try:
            doc = ApplicationDocumentORM.query.get(doc_id)
            if not doc:
                return OperationResult.error(
                    ErrorCode.DOCUMENT_NOT_FOUND,
                    f"Document {doc_id} not found."
                )
            return OperationResult.ok(data=doc)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to retrieve document: {str(exc)}"
            )

    @staticmethod
    def add_document(document: ApplicationDocumentORM) -> OperationResult:
        """Add a single document to session without committing."""
        try:
            db.session.add(document)
            return OperationResult.ok()
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to add document to session: {str(exc)}"
            )

    @staticmethod
    def add_documents(documents: list[ApplicationDocumentORM]) -> OperationResult:
        """Add multiple documents to session without committing."""
        try:
            for doc in documents:
                db.session.add(doc)
            return OperationResult.ok()
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to add documents to session: {str(exc)}"
            )

    @staticmethod
    def delete_document(document: ApplicationDocumentORM) -> OperationResult:
        """Delete a single document from session without committing."""
        try:
            db.session.delete(document)
            return OperationResult.ok()
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to delete document: {str(exc)}"
            )

    @staticmethod
    def flush() -> OperationResult:
        """Flush pending session changes to the DB without committing."""
        try:
            db.session.flush()
            return OperationResult.ok()
        except Exception as exc:
            db.session.rollback()
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to flush session: {str(exc)}"
            )
