"""Intibak (course equivalency) ORM models."""

from __future__ import annotations

from datetime import datetime

from .. import db


class IntibakTableORM(db.Model):
    """One intibak table per application — created by YGK when they start evaluation."""

    __tablename__ = "intibak_table"

    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(
        db.Integer, db.ForeignKey("application.id"), nullable=False, unique=True
    )
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    estimated_gpa = db.Column(db.Float, nullable=True)
    ranking_score = db.Column(db.Float, nullable=True)

    application = db.relationship("ApplicationORM", back_populates="intibak_table")
    courses = db.relationship(
        "IntibakCourseORM",
        back_populates="intibak_table",
        cascade="all, delete-orphan",
        order_by="IntibakCourseORM.position",
    )


class IntibakCourseORM(db.Model):
    """A single course row in an intibak table.

    side values:
      "left"  – applicant's existing course (manually entered)
      "right" – equivalent course at target university (chosen from curriculum)
      "taken" – additional course the applicant must take (chosen from curriculum)
    """

    __tablename__ = "intibak_course"

    id = db.Column(db.Integer, primary_key=True)
    intibak_table_id = db.Column(
        db.Integer, db.ForeignKey("intibak_table.id"), nullable=False, index=True
    )
    side = db.Column(db.String(8), nullable=False)
    course_name = db.Column(db.String(200), nullable=False, default="")
    course_code = db.Column(db.String(32), nullable=True)
    credits = db.Column(db.String(8), nullable=True)
    akts = db.Column(db.String(8), nullable=True)
    grade = db.Column(db.String(4), nullable=True)
    position = db.Column(db.Integer, nullable=False, default=0)

    intibak_table = db.relationship("IntibakTableORM", back_populates="courses")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "side": self.side,
            "course_name": self.course_name,
            "course_code": self.course_code or "",
            "credits": self.credits or "",
            "akts": self.akts or "",
            "grade": self.grade or "",
            "position": self.position,
        }
