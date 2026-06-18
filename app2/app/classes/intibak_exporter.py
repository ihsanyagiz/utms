"""IntibakExporter — converts an IntibakTableORM to exportable formats.

Designed for extensibility: to_dict() is the canonical representation;
to_json() uses it now; a future to_pdf() method would use the same dict.
"""

from __future__ import annotations

import json
from datetime import datetime


class IntibakExporter:
    """Converts an intibak table + its application into a structured export."""

    def __init__(self, intibak_table, application) -> None:
        self._table = intibak_table
        self._app = application

    def to_dict(self) -> dict:
        courses = self._table.courses if self._table else []
        return {
            "export_version": 1,
            "exported_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            "application": {
                "id": self._app.id,
                "full_name": self._app.full_name,
                "source_university": self._app.source_university or "",
                "target_program": self._app.target_program or "",
                "target_semester": self._app.target_semester or "",
                "current_gpa": str(self._app.current_gpa or ""),
            },
            "applicant_courses": [
                self._course_dict(c) for c in courses if c.side == "left"
            ],
            "equivalent_courses": [
                self._course_dict(c) for c in courses if c.side == "right"
            ],
            "courses_to_take": [
                self._course_dict(c, include_grade=False)
                for c in courses if c.side == "taken"
            ],
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)

    @staticmethod
    def _course_dict(course, include_grade: bool = True) -> dict:
        d = {
            "code": course.course_code or "",
            "name": course.course_name,
            "credits": course.credits or "",
            "akts": course.akts or "",
        }
        if include_grade:
            d["grade"] = course.grade or ""
        return d
