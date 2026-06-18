"""Dean routes — thin HTTP layer."""

from __future__ import annotations

from flask import Blueprint, abort, flash, redirect, render_template, request, send_file, session, url_for

from ..classes import DeanOffice
from .common import role_required

dean_api_bp = Blueprint("dean_api", __name__, url_prefix="/api/dean")


def _get_service() -> DeanOffice:
    """Get DeanOffice instance for current user."""
    return DeanOffice(
        user_id=session.get("user_id", 0),
        email=session.get("user_email", ""),
        role="dean"
    )


@dean_api_bp.route("/check-applicants", methods=["GET"])
@role_required("dean")
def check_applicants():
    """Show pending applicants."""
    service = _get_service()
    applications = service.get_pending_applicants()
    return render_template("dean_check_applicants.html", applications=applications)


_RETURN_TARGET_LABELS = {"applicant": "applicant", "oidb": "OIDB", "ydyo": "YDYO"}


@dean_api_bp.route("/return/<int:application_id>", methods=["POST"])
@role_required("dean")
def return_application(application_id):
    """Return application to a previous stage."""
    target = (request.form.get("return_target") or "").strip()
    notes = (request.form.get("dean_notes") or "").strip()
    service = _get_service()

    result = service.return_application(application_id, target, notes)

    if result.success:
        flash(f"Application returned to {_RETURN_TARGET_LABELS.get(target, target)}.", "success")
    else:
        flash(result.error_msg, "error")

    return redirect(url_for("dashboard.index", tab="receive-forward-applications"))


@dean_api_bp.route("/forward-to-ygk/<int:application_id>", methods=["POST"])
@role_required("dean")
def forward_to_ygk(application_id):
    """Forward application to YGK (department auto-determined from target program)."""
    result = _get_service().forward_to_ygk(application_id)
    if result.success:
        flash("Application forwarded to YGK successfully.", "success")
    else:
        flash(result.error_msg, "error")
    return redirect(url_for("dashboard.index", tab="receive-forward-applications"))


@dean_api_bp.route("/view-document/<int:doc_id>", methods=["GET"])
@role_required("dean")
def view_document(doc_id):
    """View application document."""
    result = _get_service().get_document(doc_id)
    if not result.success or not result.data:
        abort(404)
    doc = result.data
    return send_file(doc.file_path, mimetype="application/pdf", as_attachment=False)


@dean_api_bp.route("/forward-all-to-ygk", methods=["POST"])
@role_required("dean")
def forward_all_to_ygk():
    """Forward all pending to YGK."""
    service = _get_service()
    
    result = service.forward_all_to_ygk()
    
    if result.success:
        flash("All applications forwarded to YGK successfully.", "success")
    else:
        flash(result.error_msg, "error")
    
    return redirect(url_for("dashboard.index", tab="receive-forward-applications"))
