"""Applicant blueprint — HTTP wiring only."""

from __future__ import annotations

from flask import Blueprint, current_app, flash, redirect, render_template, request, session, url_for

from ..services.application_service import ApplicationService
from ..database import get_application_repository
from ..config import (
    APPLICATION_CANCELLATION_ALLOWED,
    APPLICATION_DOCUMENT_SLOTS,
    APPLICATION_RESUBMISSION_ALLOWED,
    APPLICATION_SUBMISSION_PERIOD_OPEN,
    APPLICATION_TRACKER_STEPS,
    APPLICATION_STATUS_STEP,
    AVAILABLE_PROGRAMS,
    AVAILABLE_SEMESTERS,
)
from .common import role_required

applicant_api_bp = Blueprint("applicant_api", __name__, url_prefix="/api/applicant")


def _get_service() -> ApplicationService:
    """Get ApplicationService for current user."""
    return ApplicationService(
        user_id=session.get("user_id", 0),
        email=session.get("user_email", ""),
        role="applicant"
    )


@applicant_api_bp.route("/track-application", methods=["GET"])
@role_required("applicant")
def track_application():
    """Get application tracking status."""
    from flask import jsonify
    
    service = _get_service()
    result = service.get_my_application()
    
    if result.success and result.data:
        status = result.data.status
    else:
        status = "No application found"
    
    return jsonify({"tab": "Track Application", "status": status})


@applicant_api_bp.route("/submit-documents", methods=["GET"])
@role_required("applicant")
def submit_documents():
    """Show application submission form."""
    service = _get_service()
    result = service.get_my_application()
    
    application = result.data if result.success else None
    
    return render_template(
        "applicant_submit.html",
        submission_open=APPLICATION_SUBMISSION_PERIOD_OPEN,
        document_slots=APPLICATION_DOCUMENT_SLOTS,
        available_programs=AVAILABLE_PROGRAMS,
        available_semesters=AVAILABLE_SEMESTERS,
        application=application,
        cancellation_allowed=APPLICATION_CANCELLATION_ALLOWED,
        resubmission_allowed=APPLICATION_RESUBMISSION_ALLOWED,
        tracker_steps=APPLICATION_TRACKER_STEPS,
        status_step=APPLICATION_STATUS_STEP,
    )


@applicant_api_bp.route("/submit-documents", methods=["POST"])
@role_required("applicant")
def create_application():
    """Submit new application."""
    if not APPLICATION_SUBMISSION_PERIOD_OPEN:
        flash("Application submission period is currently closed.", "error")
        return redirect(url_for("applicant_api.submit_documents"))

    service = _get_service()
    
    # Submit application (service handles form parsing and validation)
    result = service.submit_application(
        form_data=request.form,
        files=request.files,
        upload_root=current_app.config["APPLICATION_UPLOAD_FOLDER"],
        document_slots=APPLICATION_DOCUMENT_SLOTS,
    )
    
    if not result.success:
        flash(result.error_msg, "error")
        return redirect(url_for("applicant_api.submit_documents"))

    flash("Application submitted successfully.", "success")
    return redirect(url_for("dashboard.index"))


@applicant_api_bp.route("/resubmit-application", methods=["POST"])
@role_required("applicant")
def resubmit_application():
    """Resubmit application."""
    if not APPLICATION_RESUBMISSION_ALLOWED:
        flash("Resubmission is not currently allowed.", "error")
        return redirect(url_for("dashboard.index"))

    service = _get_service()
    
    # Get current application
    result = service.get_my_application()
    if not result.success or not result.data:
        flash("No application found.", "error")
        return redirect(url_for("dashboard.index"))
    
    application = result.data
    
    # Check status
    if application.status not in ("returned", "cancelled"):
        flash("Only returned or cancelled applications can be resubmitted.", "error")
        return redirect(url_for("dashboard.index"))

    # Resubmit application
    result = service.resubmit_application(
        application_id=application.id,
        form_data=request.form,
        files=request.files,
        upload_root=current_app.config["APPLICATION_UPLOAD_FOLDER"],
        document_slots=APPLICATION_DOCUMENT_SLOTS,
    )
    
    if not result.success:
        flash(result.error_msg, "error")
        return redirect(url_for("dashboard.index"))

    flash("Application resubmitted successfully.", "success")
    return redirect(url_for("dashboard.index"))


@applicant_api_bp.route("/cancel-application", methods=["POST"])
@role_required("applicant")
def cancel_application():
    """Cancel application."""
    if not APPLICATION_CANCELLATION_ALLOWED:
        flash("Cancellation is not currently allowed.", "error")
        return redirect(url_for("dashboard.index"))

    service = _get_service()
    
    # Get current application
    result = service.get_my_application()
    if not result.success or not result.data:
        flash("No application found.", "error")
        return redirect(url_for("dashboard.index"))
    
    application = result.data
    
    # Check status
    if application.status not in ("submitted", "returned"):
        flash("Only submitted or returned applications can be cancelled.", "error")
        return redirect(url_for("dashboard.index"))

    # Cancel application
    result = service.cancel_application(application.id)
    
    if not result.success:
        flash(result.error_msg, "error")
        return redirect(url_for("dashboard.index"))

    flash("Application cancelled successfully.", "success")
    return redirect(url_for("dashboard.index"))
