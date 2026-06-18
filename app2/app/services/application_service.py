"""Application service - orchestrates application-related operations."""

from __future__ import annotations

from ..classes import Applicant
from ..core import ErrorCode, OperationResult
from ..database import get_application_repository
from .base_service import BaseService


class ApplicationService(BaseService):
    """Service for application operations."""

    def __init__(self, user_id: int, email: str = "", role: str = "applicant"):
        """
        Initialize ApplicationService.
        
        Args:
            user_id: Current user's ID
            email: Current user's email
            role: Current user's role
        """
        self.user_id = user_id
        self.email = email
        self.role = role
        self.applicant = Applicant(user_id=user_id, email=email, role=role)

    @staticmethod
    def parse_form_data(form_dict: dict) -> dict:
        """
        Parse application form data.
        
        Args:
            form_dict: Form data from request.form
        
        Returns:
            Parsed form data dictionary
        """
        # Delegate to Applicant class's static parser
        return Applicant.parse_form_data(form_dict)

    @staticmethod
    def validate_form_data(form_data: dict) -> OperationResult | None:
        """
        Validate application form data.
        
        Args:
            form_data: Parsed form data
        
        Returns:
            OperationResult with error if validation fails, None if all valid
        """
        # Delegate to Applicant class's static validator
        result = Applicant.validate_form_data(form_data)
        # Convert to consistent return type (None if valid, OperationResult if error)
        if not result.success:
            return result
        return None

    def submit_application(
        self,
        form_data: dict,
        files: dict | None = None,
        upload_root: str = "",
        document_slots: dict | None = None,
    ) -> OperationResult:
        """
        Submit new application with documents.
        
        Args:
            form_data: Form data from request.form (raw dict)
            files: Uploaded files from request.files
            upload_root: Root directory for uploads
            document_slots: Document slot configuration
        
        Returns:
            OperationResult with success/error and message
        """
        files = files or {}
        document_slots = document_slots or {}

        # Parse and validate form data
        parsed_form = self.parse_form_data(form_data)
        validation_error = self.validate_form_data(parsed_form)
        if validation_error:
            return validation_error

        # Delegate to applicant class (which uses repository)
        return self.applicant.submit(parsed_form, upload_root, files, document_slots)

    def resubmit_application(
        self,
        application_id: int,
        form_data: dict,
        files: dict | None = None,
        upload_root: str = "",
        document_slots: dict | None = None,
    ) -> OperationResult:
        """
        Resubmit application with updated data and documents.
        
        Args:
            application_id: ID of application to update
            form_data: Updated form data (raw dict)
            files: New files to upload
            upload_root: Root directory for uploads
            document_slots: Document slot configuration
        
        Returns:
            OperationResult with success/error
        """
        files = files or {}
        document_slots = document_slots or {}

        # Parse and validate form data
        parsed_form = self.parse_form_data(form_data)
        validation_error = self.validate_form_data(parsed_form)
        if validation_error:
            return validation_error

        # Get existing application
        app_repo = get_application_repository()
        result = app_repo.find_by_id(application_id)
        if not result.success:
            return result

        application = result.data
        if application is None:
            return self.error(
                ErrorCode.NOT_FOUND,
                "Application not found"
            )

        # Check ownership
        if application.applicant_id != self.user_id:
            return self.error(
                ErrorCode.VALIDATION_FAILED,
                "You can only resubmit your own application"
            )

        # Check status
        if application.status not in ("returned", "cancelled"):
            return self.error(
                ErrorCode.VALIDATION_FAILED,
                "Only returned or cancelled applications can be resubmitted"
            )

        # Delegate to applicant class
        return self.applicant.resubmit(application, parsed_form, upload_root, files, document_slots)

    def cancel_application(self, application_id: int) -> OperationResult:
        """
        Cancel application.
        
        Args:
            application_id: ID of application to cancel
        
        Returns:
            OperationResult with success/error
        """
        # Get existing application
        app_repo = get_application_repository()
        result = app_repo.find_by_id(application_id)
        if not result.success:
            return result

        application = result.data
        if application is None:
            return self.error(
                ErrorCode.NOT_FOUND,
                "Application not found"
            )

        # Check ownership
        if application.applicant_id != self.user_id:
            return self.error(
                ErrorCode.VALIDATION_FAILED,
                "You can only cancel your own application"
            )

        # Check status
        if application.status not in ("submitted", "returned"):
            return self.error(
                ErrorCode.VALIDATION_FAILED,
                "Only submitted or returned applications can be cancelled"
            )

        # Delegate to applicant class
        return self.applicant.cancel(application)

    def get_application(self, application_id: int) -> OperationResult:
        """
        Get application details.
        
        Args:
            application_id: ID of application
        
        Returns:
            OperationResult with application data
        """
        app_repo = get_application_repository()
        result = app_repo.find_by_id(application_id)
        
        if result.success and result.data:
            # Check ownership
            if result.data.applicant_id != self.user_id:
                return self.error(
                    ErrorCode.VALIDATION_FAILED,
                    "You do not have access to this application"
                )
        
        return result

    def get_my_application(self) -> OperationResult:
        """
        Get current user's application (if exists).
        
        Returns:
            OperationResult with application data or NOT_FOUND
        """
        app_repo = get_application_repository()
        return app_repo.find_by_applicant_id(self.user_id)
