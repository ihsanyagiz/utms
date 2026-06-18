"""Intibak table data repository."""

from __future__ import annotations

from .. import db
from ..core import ErrorCode, OperationResult
from ..models.intibak import IntibakCourseORM, IntibakTableORM

_VALID_GRADES = {"AA", "AB", "BB", "BC", "CC", "CD", "DD", "DF", "FF", ""}
_VALID_SIDES = {"left", "right", "taken"}


class IntibakRepository:
    """Data access for IntibakTableORM and IntibakCourseORM."""

    @staticmethod
    def get_or_create_table(application_id: int) -> OperationResult:
        try:
            table = IntibakTableORM.query.filter_by(application_id=application_id).first()
            if not table:
                table = IntibakTableORM(application_id=application_id)
                db.session.add(table)
                db.session.commit()
            return OperationResult.ok(data=table)
        except Exception as exc:
            db.session.rollback()
            return OperationResult.error(ErrorCode.DB_ERROR, str(exc))

    @staticmethod
    def get_table(application_id: int) -> OperationResult:
        try:
            table = IntibakTableORM.query.filter_by(application_id=application_id).first()
            return OperationResult.ok(data=table)
        except Exception as exc:
            return OperationResult.error(ErrorCode.DB_ERROR, str(exc))

    @staticmethod
    def add_course(table_id: int, side: str, course_data: dict) -> OperationResult:
        if side not in _VALID_SIDES:
            return OperationResult.error(ErrorCode.VALIDATION_FAILED, f"Invalid side: {side}")
        grade = course_data.get("grade", "")
        if grade and grade not in _VALID_GRADES:
            return OperationResult.error(ErrorCode.VALIDATION_FAILED, f"Invalid grade: {grade}")
        try:
            # Determine next position for this side
            max_pos = (
                db.session.query(db.func.max(IntibakCourseORM.position))
                .filter_by(intibak_table_id=table_id, side=side)
                .scalar()
            )
            position = (max_pos or 0) + 1
            course = IntibakCourseORM(
                intibak_table_id=table_id,
                side=side,
                course_name=course_data.get("course_name", ""),
                course_code=course_data.get("course_code") or None,
                credits=course_data.get("credits") or None,
                akts=course_data.get("akts") or None,
                grade=grade or None,
                position=position,
            )
            db.session.add(course)
            db.session.commit()
            return OperationResult.ok(data=course)
        except Exception as exc:
            db.session.rollback()
            return OperationResult.error(ErrorCode.DB_ERROR, str(exc))

    @staticmethod
    def delete_course(course_id: int) -> OperationResult:
        try:
            course = IntibakCourseORM.query.get(course_id)
            if not course:
                return OperationResult.error(ErrorCode.NOT_FOUND, "Course not found.")
            db.session.delete(course)
            db.session.commit()
            return OperationResult.ok()
        except Exception as exc:
            db.session.rollback()
            return OperationResult.error(ErrorCode.DB_ERROR, str(exc))

    @staticmethod
    def save_ranking_score(table_id: int, ranking_score: float | None) -> OperationResult:
        try:
            table = IntibakTableORM.query.get(table_id)
            if not table:
                return OperationResult.error(ErrorCode.NOT_FOUND, "Intibak table not found.")
            if ranking_score is not None:
                table.ranking_score = round(ranking_score, 4)
            db.session.commit()
            return OperationResult.ok(data=table)
        except Exception as exc:
            db.session.rollback()
            return OperationResult.error(ErrorCode.DB_ERROR, str(exc))

    @staticmethod
    def update_course_grade(course_id: int, grade: str) -> OperationResult:
        if grade and grade not in _VALID_GRADES:
            return OperationResult.error(ErrorCode.VALIDATION_FAILED, f"Invalid grade: {grade}")
        try:
            course = IntibakCourseORM.query.get(course_id)
            if not course:
                return OperationResult.error(ErrorCode.NOT_FOUND, "Course not found.")
            course.grade = grade or None
            db.session.commit()
            return OperationResult.ok(data=course)
        except Exception as exc:
            db.session.rollback()
            return OperationResult.error(ErrorCode.DB_ERROR, str(exc))
