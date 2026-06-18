"""Applicant role class."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename

from ...core import OperationResult, ErrorCode
from ...database import get_application_repository
from ...models import ApplicationDocumentORM
from ..interfaces import IDocumentHandler
from .base import User

_MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_turkish_id(tc_no: str) -> bool:
    if not tc_no or len(tc_no) != 11 or not tc_no.isdigit():
        return False
    if tc_no[0] == '0':
        return False
    digits = [int(d) for d in tc_no]
    odd_sum = sum(digits[0:9:2])
    even_sum = sum(digits[1:8:2])
    if ((odd_sum * 7) - even_sum) % 10 != digits[9]:
        return False
    if sum(digits[0:10]) % 10 != digits[10]:
        return False
    return True


class Applicant(User, IDocumentHandler):
    """Applicant business role."""

    # --- IDocumentHandler interface ---

    def upload(self, payload: dict[str, Any]) -> OperationResult:
        if not payload:
            return OperationResult.error(ErrorCode.VALIDATION_FAILED, "Payload cannot be empty.")
        return OperationResult.ok(data=payload)

    def validate(self, document_id: int) -> OperationResult:
        if document_id <= 0:
            return OperationResult.error(ErrorCode.VALIDATION_FAILED, "Document ID must be positive.")
        return OperationResult.ok()

    def retrieve(self, applicant_id: int) -> OperationResult:
        return OperationResult.ok(data=[])

    # --- Form helpers (static — no Flask context needed) ---

    @staticmethod
    def parse_form_data(form) -> dict:
        """Parse and normalize form data for application submission."""
        id_number = (form.get("id_number") or "").strip()
        target_program = (form.get("target_program") or "").strip()
        return {
            "full_name": (form.get("full_name") or "").strip(),
            "id_number": id_number,
            "student_number": id_number,
            "target_program": target_program,
            "target_department": target_program,
            "target_semester": (form.get("target_semester") or "").strip(),
            "current_gpa": (form.get("current_gpa") or "").strip(),
            "source_university": (form.get("source_university") or "").strip(),
            "is_currently_enrolled": True,
            "osym_points": (form.get("osym_points") or "").strip(),
        }

    @staticmethod
    def validate_form_data(form_data: dict) -> OperationResult:
        """Validate application form data. Returns OperationResult."""
        required = [
            "full_name",
            "id_number",
            "target_program",
            "target_semester",
            "current_gpa",
            "source_university",
            "osym_points",
        ]
        if not all(bool(form_data.get(k)) for k in required):
            return OperationResult.error(
                ErrorCode.MISSING_REQUIRED_FIELDS,
                "All required fields must be filled."
            )

        id_number = form_data["id_number"]
        if not validate_turkish_id(id_number):
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                "ID number is not a valid Turkish National ID."
            )

        try:
            gpa = float(form_data["current_gpa"])
            if not (0.0 <= gpa <= 4.0):
                return OperationResult.error(ErrorCode.GPA_OUT_OF_RANGE, "GPA must be between 0.00 and 4.00.")
        except ValueError:
            return OperationResult.error(ErrorCode.VALIDATION_FAILED, "GPA must be a valid number (e.g. 3.50).")

        try:
            osym = float(form_data["osym_points"])
            if not (0 <= osym <= 560):
                return OperationResult.error(ErrorCode.VALIDATION_FAILED, "OSYM points must be between 0 and 560.")
        except ValueError:
            return OperationResult.error(ErrorCode.VALIDATION_FAILED, "OSYM points must be a valid number.")

        return OperationResult.ok()

    # --- Document saving ---

    def save_documents(self, application_id: int, upload_root, files, document_slots) -> list:
        """Save uploaded documents to disk. Returns list of ApplicationDocument objects."""
        docs = []
        for slot_def in document_slots:
            slot = slot_def["slot"]
            label = slot_def["label"]
            file_item = files.get(f"document_{slot}")
            if file_item is None or file_item.filename == "":
                continue
            if not file_item.filename.lower().endswith(".pdf"):
                raise ValueError(f"'{label}' must be a PDF file.")
            file_item.stream.seek(0, 2)
            size = file_item.stream.tell()
            file_item.stream.seek(0)
            if size > _MAX_FILE_SIZE:
                raise ValueError(f"'{label}' exceeds the 5 MB size limit.")
            safe_name = secure_filename(file_item.filename)
            stored_name = f"application_{application_id}_document_{slot}_{safe_name}"
            full_path = Path(upload_root) / stored_name
            file_item.save(full_path)
            docs.append(ApplicationDocumentORM(
                application_id=application_id,
                document_slot=slot,
                original_name=safe_name,
                stored_name=stored_name,
                file_path=str(full_path),
            ))
        return docs

    def _validate_required_docs(self, files, document_slots) -> OperationResult | None:
        """Return an error OperationResult if any required document is missing or invalid."""
        for slot_def in document_slots:
            if slot_def.get("optional"):
                continue
            slot = slot_def["slot"]
            label = slot_def["label"]
            file_item = files.get(f"document_{slot}")
            if file_item is None or file_item.filename == "":
                return OperationResult.error(
                    ErrorCode.MISSING_REQUIRED_FIELDS,
                    f"'{label}' is required. Please upload a PDF file."
                )
            if not file_item.filename.lower().endswith(".pdf"):
                return OperationResult.error(
                    ErrorCode.INVALID_FILE_FORMAT,
                    f"'{label}' must be a PDF file."
                )
            file_item.stream.seek(0, 2)
            size = file_item.stream.tell()
            file_item.stream.seek(0)
            if size > _MAX_FILE_SIZE:
                return OperationResult.error(
                    ErrorCode.INVALID_FILE_FORMAT,
                    f"'{label}' exceeds the 5 MB size limit."
                )
        return None

    # --- Application lifecycle ---

    def submit(self, form_data: dict, upload_root, files, document_slots) -> OperationResult:
        """Submit new application. Returns OperationResult with created Application."""
        app_repo = get_application_repository()

        result = app_repo.find_by_applicant_id(self.user_id)
        if not result.success:
            return result
        if result.data is not None:
            return OperationResult.error(ErrorCode.APPLICATION_EXISTS, "You already have an application.")

        doc_error = self._validate_required_docs(files, document_slots)
        if doc_error:
            return doc_error

        try:
            create_result = app_repo.create(applicant_id=self.user_id, status="submitted", **form_data)
            if not create_result.success:
                return create_result

            application = create_result.data
            root = Path(upload_root)
            root.mkdir(parents=True, exist_ok=True)

            docs = self.save_documents(application.id, root, files, document_slots)
            add_docs_result = app_repo.add_documents(docs)
            if not add_docs_result.success:
                app_repo.rollback()
                return add_docs_result

            commit_result = app_repo.commit()
            if not commit_result.success:
                return commit_result

            return OperationResult.ok(data=application)
        except ValueError as exc:
            app_repo.rollback()
            return OperationResult.error(ErrorCode.INVALID_FILE_FORMAT, str(exc))
        except OSError:
            app_repo.rollback()
            return OperationResult.error(ErrorCode.FILE_NOT_SAVED, "Could not store uploaded files.")
        except Exception as exc:
            app_repo.rollback()
            return OperationResult.error(ErrorCode.DB_ERROR, f"Submission failed: {str(exc)}")

    def resubmit(self, application, form_data: dict, upload_root, files, document_slots) -> OperationResult:
        """Resubmit application. Returns OperationResult."""
        app_repo = get_application_repository()

        doc_error = self._validate_required_docs(files, document_slots)
        if doc_error:
            return doc_error

        try:
            for field, value in form_data.items():
                setattr(application, field, value)
            application.status = "submitted"
            application.oidb_notes = None
            application.dean_notes = None
            application.doc_checker_status = "needs_manual_check"
            application.doc_checker_errors = None

            old_docs = list(application.documents)
            for old_doc in old_docs:
                del_result = app_repo.delete_document(old_doc)
                if not del_result.success:
                    app_repo.rollback()
                    return del_result

            # Flush deletes before inserting new documents to avoid UNIQUE constraint on (application_id, document_slot)
            flush_result = app_repo.flush()
            if not flush_result.success:
                app_repo.rollback()
                return flush_result

            root = Path(upload_root)
            root.mkdir(parents=True, exist_ok=True)
            docs = self.save_documents(application.id, root, files, document_slots)
            add_docs_result = app_repo.add_documents(docs)
            if not add_docs_result.success:
                app_repo.rollback()
                return add_docs_result

            commit_result = app_repo.commit()
            if not commit_result.success:
                return commit_result

            return OperationResult.ok(data=application)
        except ValueError as exc:
            app_repo.rollback()
            return OperationResult.error(ErrorCode.INVALID_FILE_FORMAT, str(exc))
        except OSError:
            app_repo.rollback()
            return OperationResult.error(ErrorCode.FILE_NOT_SAVED, "Could not store uploaded files.")
        except Exception as exc:
            app_repo.rollback()
            return OperationResult.error(ErrorCode.DB_ERROR, f"Resubmission failed: {str(exc)}")

    def cancel(self, application) -> OperationResult:
        """Cancel application. Returns OperationResult."""
        app_repo = get_application_repository()

        try:
            application.status = "cancelled"
            commit_result = app_repo.commit()
            if not commit_result.success:
                return commit_result
            return OperationResult.ok(data=application)
        except Exception as exc:
            app_repo.rollback()
            return OperationResult.error(ErrorCode.DB_ERROR, f"Failed to cancel application: {str(exc)}")
