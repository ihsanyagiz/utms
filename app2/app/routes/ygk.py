"""YGK routes — thin HTTP layer."""

from __future__ import annotations

import io

from flask import Blueprint, abort, jsonify, request, send_file, session

from ..classes import YGK
from ..classes.intibak_exporter import IntibakExporter
from ..database import get_intibak_repository
from ..models import ApplicationORM
from .common import role_required

ygk_api_bp = Blueprint("ygk_api", __name__, url_prefix="/api/ygk")


def _get_service() -> YGK:
    return YGK(
        user_id=session.get("user_id", 0),
        email=session.get("user_email", ""),
        role="ygk",
    )


# ── Intibak AJAX endpoints ──

@ygk_api_bp.route("/intibak/<int:app_id>/add-course", methods=["POST"])
@role_required("ygk")
def add_course(app_id: int):
    data = request.get_json(silent=True) or {}
    side = data.get("side", "").strip()
    course_data = {
        "course_name": (data.get("course_name") or "").strip(),
        "course_code": (data.get("course_code") or "").strip(),
        "credits": (data.get("credits") or "").strip(),
        "akts": (data.get("akts") or "").strip(),
        "grade": (data.get("grade") or "").strip(),
    }
    if not course_data["course_name"]:
        return jsonify({"success": False, "error": "Course name is required."}), 400

    result = _get_service().add_course(app_id, side, course_data)
    if result.success:
        return jsonify({"success": True, "course": result.data.to_dict()})
    return jsonify({"success": False, "error": result.error_msg}), 400


@ygk_api_bp.route("/intibak/course/<int:course_id>", methods=["DELETE"])
@role_required("ygk")
def delete_course(course_id: int):
    result = _get_service().delete_course(course_id)
    if result.success:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": result.error_msg}), 400


@ygk_api_bp.route("/intibak/course/<int:course_id>", methods=["PATCH"])
@role_required("ygk")
def update_course(course_id: int):
    data = request.get_json(silent=True) or {}
    grade = (data.get("grade") or "").strip()
    result = _get_service().update_course_grade(course_id, grade)
    if result.success:
        return jsonify({"success": True, "course": result.data.to_dict()})
    return jsonify({"success": False, "error": result.error_msg}), 400


def _calc_ranking_score(app_obj) -> float | None:
    """Horizontal transfer ranking score (0–100):
    score = (osym / 560) * 90  +  (current_gpa / 4.0) * 10
    Uses the applicant's submitted GPA and OSYM. Returns None when either is absent."""
    try:
        osym = float(app_obj.osym_points) if app_obj and app_obj.osym_points else None
        gpa  = float(app_obj.current_gpa)  if app_obj and app_obj.current_gpa  else None
        if osym is None or gpa is None:
            return None
        return round((osym / 560.0) * 90.0 + (gpa / 4.0) * 10.0, 4)
    except (TypeError, ValueError):
        return None


@ygk_api_bp.route("/intibak/<int:app_id>/export-json", methods=["GET"])
@role_required("ygk")
def export_json(app_id: int):
    app_obj = ApplicationORM.query.get(app_id)
    if not app_obj:
        abort(404)
    intibak_repo = get_intibak_repository()
    table_result = intibak_repo.get_or_create_table(app_id)
    if not table_result.success:
        abort(500)
    exporter = IntibakExporter(table_result.data, app_obj)
    json_bytes = exporter.to_json().encode("utf-8")
    filename = f"intibak_{app_id}_{app_obj.full_name.replace(' ', '_')}.json"
    return send_file(
        io.BytesIO(json_bytes),
        mimetype="application/json",
        as_attachment=True,
        download_name=filename,
    )


@ygk_api_bp.route("/intibak/<int:app_id>/send-to-oidb", methods=["POST"])
@role_required("ygk")
def send_to_oidb(app_id: int):
    app_obj = ApplicationORM.query.get(app_id)
    if not app_obj:
        return jsonify({"success": False, "error": "Application not found."}), 404
    ranking_score = _calc_ranking_score(app_obj)
    result = _get_service().approve_for_oidb(app_id, ranking_score)
    if result.success:
        return jsonify({"success": True, "ranking_score": ranking_score})
    return jsonify({"success": False, "error": result.error_msg}), 400


# ── Document viewer (transcript) ──

@ygk_api_bp.route("/view-document/<int:doc_id>", methods=["GET"])
@role_required("ygk")
def view_document(doc_id: int):
    result = _get_service().get_document(doc_id)
    if not result.success or not result.data:
        abort(404)
    doc = result.data
    return send_file(doc.file_path, mimetype="application/pdf", as_attachment=False)
