"""Admin role class — software management (users, config, database)."""

from __future__ import annotations

from ...core import OperationResult, ErrorCode
from ...database import get_application_repository, get_database_interface, get_user_repository
from ...config import (
    APPLICATION_SUBMISSION_PERIOD_OPEN,
    APPLICATION_CANCELLATION_ALLOWED,
    APPLICATION_RESUBMISSION_ALLOWED,
    ROLE_DEFINITIONS,
)
from .base import User

# All valid role slugs an admin may assign (admin excluded — no self-promotion via UI)
_ASSIGNABLE_ROLES = {r["slug"] for r in ROLE_DEFINITIONS}


class Admin(User):
    """Admin role: manages users, config and database."""

    # --- User management ---

    def list_users(self) -> OperationResult:
        """Return all users ordered by role then email."""
        try:
            user_repo = get_user_repository()
            users = user_repo.list_all_users()
            return OperationResult.ok(data=users or [])
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to list users: {str(exc)}"
            )

    def change_user_role(self, target_user_id: int, new_role: str) -> OperationResult:
        """Change a user's role. Only assignable (non-admin) roles are allowed."""
        if new_role not in _ASSIGNABLE_ROLES:
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                f"'{new_role}' is not a valid role."
            )
        try:
            user_repo = get_user_repository()
            updated = user_repo.update_user_role(target_user_id, new_role)
            if updated is None:
                return OperationResult.error(
                    ErrorCode.NOT_FOUND,
                    f"User {target_user_id} not found."
                )
            return OperationResult.ok(data=updated)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Failed to update user role: {str(exc)}"
            )

    # --- Config view ---

    def get_config_summary(self) -> dict:
        """Return current feature flag values from config."""
        return {
            "submission_open": APPLICATION_SUBMISSION_PERIOD_OPEN,
            "cancellation_allowed": APPLICATION_CANCELLATION_ALLOWED,
            "resubmission_allowed": APPLICATION_RESUBMISSION_ALLOWED,
        }

    # --- Database ---

    def get_all_applications(self) -> OperationResult:
        """Return every application for admin overview."""
        return get_application_repository().get_all()

    def trigger_backup(self) -> OperationResult:
        """Create a timestamped SQLite backup file."""
        try:
            db_interface = get_database_interface()
            path = db_interface.backup()
            if path is None:
                return OperationResult.error(
                    ErrorCode.DB_ERROR,
                    "Backup failed or database is not SQLite."
                )
            return OperationResult.ok(data={"path": path})
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Backup error: {str(exc)}"
            )

    def list_backups(self) -> OperationResult:
        """List available backups sorted newest-first."""
        try:
            backups = get_database_interface().list_backups()
            return OperationResult.ok(data=backups)
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Could not list backups: {str(exc)}"
            )

    def restore_backup(self, filename: str) -> OperationResult:
        """Restore the database from a named backup file."""
        try:
            path = get_database_interface().restore_backup(filename)
            return OperationResult.ok(data={"path": path})
        except (ValueError, FileNotFoundError) as exc:
            return OperationResult.error(
                ErrorCode.VALIDATION_FAILED,
                str(exc)
            )
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Restore failed: {str(exc)}"
            )

    def reset_and_seed(self) -> OperationResult:
        """Wipe all application data and reload synthetic seed data."""
        try:
            from ... import db
            from ...models import (
                ApplicationDocumentORM, ApplicationORM, UserORM,
                IntibakTableORM, IntibakCourseORM,
            )
            from ...cli import seed_all
            seed_all(db, ApplicationDocumentORM, ApplicationORM, UserORM, IntibakTableORM, IntibakCourseORM)
            return OperationResult.ok(data={"message": "Database wiped and reseeded successfully."})
        except Exception as exc:
            return OperationResult.error(
                ErrorCode.DB_ERROR,
                f"Reset failed: {str(exc)}"
            )
