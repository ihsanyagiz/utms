"""User database model."""

from __future__ import annotations

from werkzeug.security import check_password_hash, generate_password_hash

from .. import db


class UserORM(db.Model):
    """User account for authentication and role-based access."""

    __tablename__ = "user"
    __table_args__ = (db.UniqueConstraint("email", "role", name="uq_user_email_role"),)

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(32), nullable=False, index=True)
    # For YGK users: the department key they belong to (e.g. "computer_engineering")
    department = db.Column(db.String(120), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    application = db.relationship("ApplicationORM", back_populates="applicant", uselist=False)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
