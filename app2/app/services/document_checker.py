"""Document Checker service — abstract interface and pluggable mock implementation.

A real implementation replaces MockDocumentChecker without touching any other code:
  - Parse uploaded PDFs (OCR / regex patterns)
  - Query authoritative external sources (university APIs, YKS result service, etc.)
  - Any combination of the above

Inject a checker by passing it to Oidb.auto_check_and_forward_all(checker) or
Ydyo.auto_check_and_forward_all(checker). The default argument uses MockDocumentChecker.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class DocumentCheckError:
    """One validation failure produced by the document checker."""

    # "document" — a required file slot is missing or invalid
    # "field"    — a data field (id_number, current_gpa, …) is invalid
    type: str
    reason: str                  # Human-readable explanation shown in the UI
    slot: int | None = None      # Set when type == "document"
    field_name: str | None = None  # Set when type == "field"

    def to_dict(self) -> dict:
        return {
            "type": self.type,
            "reason": self.reason,
            "slot": self.slot,
            "field": self.field_name,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "DocumentCheckError":
        return cls(
            type=d.get("type", ""),
            reason=d.get("reason", ""),
            slot=d.get("slot"),
            field_name=d.get("field"),
        )


@dataclass
class DocumentCheckResult:
    """Outcome of running the checker against one application."""

    passed: bool
    errors: list[DocumentCheckError] = field(default_factory=list)


class IDocumentChecker(ABC):
    """
    Interface for the Document Checker service.

    Implement this class to add real document verification.  The interface is
    intentionally minimal so implementations can differ wildly in strategy:

        class RealDocumentChecker(IDocumentChecker):
            def check_application(self, application) -> DocumentCheckResult:
                # call external API, parse PDFs, cross-check YKS scores …
                ...

    The implementation is injected at call time:

        checker = RealDocumentChecker(api_key=...)
        result  = oidb_instance.auto_check_and_forward_all(checker)
    """

    @abstractmethod
    def check_application(self, application) -> DocumentCheckResult:
        """
        Validate all documents and fields of an application.

        Args:
            application: ApplicationORM instance (documents relationship pre-loaded)

        Returns:
            DocumentCheckResult — .passed is True only when errors is empty.
        """


# ---------------------------------------------------------------------------
# Mock implementation — used until a real checker is wired in
# ---------------------------------------------------------------------------

_REQUIRED_SLOTS: set[int] = {1, 2, 3}   # Student Cert, Transcript, YKS Score

_SLOT_LABELS: dict[int, str] = {
    1: "Student Certificate",
    2: "Transcript",
    3: "YKS Score Report",
    4: "English Proficiency Certificate",
    5: "OSYM Certificate",
}


class MockDocumentChecker(IDocumentChecker):
    """
    Development / testing stand-in for a real document checker.

    Checks:
      - Required document slots (1-3) are present
      - current_gpa is a number in [2.50, 4.00]
      - id_number is non-empty and numeric

    Does NOT inspect actual file contents — a production implementation would.
    """

    def check_application(self, application) -> DocumentCheckResult:
        errors: list[DocumentCheckError] = []

        present_slots = {doc.document_slot for doc in (application.documents or [])}

        for slot in sorted(_REQUIRED_SLOTS):
            if slot not in present_slots:
                errors.append(DocumentCheckError(
                    type="document",
                    slot=slot,
                    reason=f"{_SLOT_LABELS.get(slot, f'Slot {slot}')} is missing.",
                ))

        try:
            gpa = float(application.current_gpa or 0)
            if gpa < 2.5:
                errors.append(DocumentCheckError(
                    type="field",
                    field_name="current_gpa",
                    reason=f"GPA {gpa:.2f} is below the minimum required 2.50.",
                ))
        except (ValueError, TypeError):
            errors.append(DocumentCheckError(
                type="field",
                field_name="current_gpa",
                reason="GPA value is not a valid number.",
            ))

        id_number = (application.id_number or "").strip()
        if not id_number:
            errors.append(DocumentCheckError(
                type="field",
                field_name="id_number",
                reason="ID number is missing.",
            ))
        elif not id_number.replace("-", "").isdigit():
            errors.append(DocumentCheckError(
                type="field",
                field_name="id_number",
                reason="ID number must contain only digits.",
            ))

        return DocumentCheckResult(passed=len(errors) == 0, errors=errors)
