"""YDYO routes — thin HTTP layer."""

from __future__ import annotations

from flask import Blueprint, abort, flash, redirect, render_template, request, session, send_file, url_for

from ..classes import Ydyo
from .common import role_required

ydyo_api_bp = Blueprint("ydyo_api", __name__, url_prefix="/api/ydyo")


def _get_service() -> Ydyo:
    """Get Ydyo instance for current user."""
    return Ydyo(
        user_id=session.get("user_id", 0),
        email=session.get("user_email", ""),
        role="ydyo"
    )


@ydyo_api_bp.route("/check-documents", methods=["GET"])
@role_required("ydyo")
def check_documents():
    """Show pending applications."""
    service = _get_service()
    return render_template("ydyo_check_documents.html", applications=service.get_applications())


@ydyo_api_bp.route("/mark-and-forward/<int:application_id>", methods=["POST"])
@role_required("ydyo")
def mark_and_forward(application_id):
    """Mark application and forward to Dean."""
    prep_status = (request.form.get("prep_status") or "").strip()
    service = _get_service()
    
    result = service.mark_and_forward(application_id, prep_status)
    
    if result.success:
        flash("Application marked and forwarded successfully.", "success")
    else:
        flash(result.error_msg, "error")
    
    return redirect(url_for("dashboard.index", tab="set-prep-school-status"))


@ydyo_api_bp.route("/forward-all-to-dean", methods=["POST"])
@role_required("ydyo")
def forward_all_to_dean():
    """Forward all to Dean (no document checking)."""
    service = _get_service()
    result = service.forward_all_to_dean()
    if result.success:
        flash("All applications forwarded to Dean successfully.", "success")
    else:
        flash(result.error_msg, "error")
    return redirect(url_for("dashboard.index", tab="set-prep-school-status"))


@ydyo_api_bp.route("/auto-check-and-forward", methods=["POST"])
@role_required("ydyo")
def auto_check_and_forward():
    """Run document checker on all forwarded_to_ydyo applications and forward those that pass."""
    service = _get_service()
    result = service.auto_check_and_forward_all()
    if result.success:
        data = result.data or {}
        forwarded = data.get("forwarded", 0)
        flagged = data.get("flagged", 0)
        flash(
            f"Auto-check complete: {forwarded} forwarded to Dean, "
            f"{flagged} flagged with errors (require manual review).",
            "success" if flagged == 0 else "warning",
        )
    else:
        flash(result.error_msg, "error")
    return redirect(url_for("dashboard.index", tab="set-prep-school-status"))


@ydyo_api_bp.route("/view-document/<int:doc_id>", methods=["GET"])
@role_required("ydyo")
def view_document(doc_id):
    """View application document."""
    service = _get_service()
    
    result = service.get_document(doc_id)
    if not result.success or not result.data:
        abort(404)
    
    doc = result.data
    return send_file(doc.file_path, mimetype="application/pdf", as_attachment=False)
