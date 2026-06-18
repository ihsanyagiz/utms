"""Intibak (course equivalency) domain entity."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class IntibakTable:
    """Course equivalency table container."""

    table_id: int
    applicant_id: int
    state: str
