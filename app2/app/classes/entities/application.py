"""Application and document domain entities."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import List


@dataclass(slots=True)
class Application:
    """Transfer application aggregate root."""

    application_id: int
    submission_date: datetime
    status: str
    student_id: int
    target_id: int
    documents: List["Document"]


@dataclass(slots=True)
class Document:
    """Document metadata and status."""

    document_id: int
    application_id: int
    filename: str
    status: str
