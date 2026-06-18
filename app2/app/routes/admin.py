"""Admin blueprint — user management, config view, database backup."""

from __future__ import annotations

from flask import Blueprint, flash, redirect, request, session, url_for

from ..classes import Admin
from .common import role_required

admin_bp = Blueprint("admin_api", __name__, url_prefix="/api/admin")


def _admin() -> Admin:
    return Admin(session["user_id"], session["user_email"], "admin")


@admin_bp.route("/users/change-role", methods=["POST"])
@role_required("admin")
def change_user_role():
    try:
        target_id = int(request.form.get("user_id", 0))
    except ValueError:
        flash("Invalid user ID.", "error")
        return redirect(url_for("dashboard.index"))

    new_role = (request.form.get("new_role") or "").strip()
    result = _admin().change_user_role(target_id, new_role)

    if result.success:
        flash(f"Role updated to '{new_role}'.", "success")
    else:
        flash(result.error_msg, "error")

    return redirect(url_for("dashboard.index"))


@admin_bp.route("/backup", methods=["POST"])
@role_required("admin")
def trigger_backup():
    result = _admin().trigger_backup()

    if result.success:
        flash(f"Backup created: {result.data['path']}", "success")
    else:
        flash(result.error_msg, "error")

    return redirect(url_for("dashboard.index"))


@admin_bp.route("/restore", methods=["POST"])
@role_required("admin")
def restore_backup():
    filename = (request.form.get("filename") or "").strip()
    if not filename:
        flash("No backup filename provided.", "error")
        return redirect(url_for("dashboard.index"))

    result = _admin().restore_backup(filename)

    if result.success:
        flash(f"Database restored from '{filename}'.", "success")
    else:
        flash(result.error_msg, "error")

    return redirect(url_for("dashboard.index"))


@admin_bp.route("/reset-and-seed", methods=["POST"])
@role_required("admin")
def reset_and_seed():
    result = _admin().reset_and_seed()

    if result.success:
        flash("Database wiped and reseeded with synthetic data.", "success")
    else:
        flash(result.error_msg, "error")

    return redirect(url_for("dashboard.index"))
