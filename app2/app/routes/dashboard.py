"""Role-aware dashboard blueprint."""

from __future__ import annotations

import math
import re

from flask import Blueprint, render_template, request, session
from sqlalchemy.orm import selectinload

from ..config import (
    APPLICATION_CANCELLATION_ALLOWED,
    APPLICATION_DOCUMENT_SLOTS,
    APPLICATION_RESUBMISSION_ALLOWED,
    APPLICATION_STATUS_STEP,
    APPLICATION_SUBMISSION_PERIOD_OPEN,
    APPLICATION_TRACKER_STEPS,
    AVAILABLE_FACULTIES,
    AVAILABLE_PROGRAMS,
    AVAILABLE_SEMESTERS,
    PHASE1_TABS,
    ROLE_DEFINITIONS,
)
from ..curricula import get_curriculum
from ..programs import PROGRAMS_BY_FACULTY
from ..models import ApplicationORM
from .common import login_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")

_PER_PAGE = 10


def _slugify(title: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')


def _build_pagination(total: int, page: int, per_page: int) -> dict:
    total_pages = max(1, math.ceil(total / per_page))
    page = max(1, min(page, total_pages))
    return {
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": total_pages,
        "has_prev": page > 1,
        "has_next": page < total_pages,
    }


def _status_counts(apps: list, statuses: list[str]) -> dict:
    counts = {"total": len(apps)}
    for s in statuses:
        counts[s] = sum(1 for a in apps if a.status == s)
    return counts


def _filter_apps(apps: list, filter_status: str) -> list:
    if not filter_status or filter_status == "all":
        return apps
    statuses = set(filter_status.split(","))
    return [a for a in apps if a.status in statuses]



_OIDB_VISIBLE_STATUSES = {"submitted", "forwarded_to_ydyo", "returned", "cancelled"}


def _oidb_sort_priority(app) -> tuple:
    status = app.status
    has_dean_notes = bool(getattr(app, "dean_notes", None))
    if status == "submitted" and has_dean_notes:
        bucket = 0
    elif status == "submitted":
        bucket = 1
    elif status == "forwarded_to_ydyo":
        bucket = 2
    elif status == "returned":
        bucket = 3
    elif status == "cancelled":
        bucket = 4
    else:
        bucket = 5
    return (bucket, app.id or 0)


def _sort_apps(apps: list, sort_col, sort_dir: str, col_map: dict) -> list:
    if sort_col is None or sort_col not in col_map:
        return apps
    attr = col_map[sort_col]
    reverse = sort_dir == "desc"
    def key(a):
        v = getattr(a, attr, None)
        if v is None:
            return (1, 0, "")
        if isinstance(v, (int, float)):
            return (0, v, "")
        if hasattr(v, "isoformat"):
            return (0, 0, v.isoformat())
        return (0, 0, str(v).lower())
    return sorted(apps, key=key, reverse=reverse)


def _get_tab_data(
    role_slug: str, tab_slug: str, page: int, user_id: int, email: str,
    filter_status: str = "all", sort_col=None, sort_dir: str = "asc",
) -> dict:
    """Return template context for one tab, with pagination where applicable."""
    per_page = _PER_PAGE
    offset = (page - 1) * per_page

    if role_slug == "oidb" and tab_slug == "create-ranking-table":
        from ..database import get_application_repository
        result = get_application_repository().get_intibak_complete_apps()
        all_apps = result.data or []
        # Sort by ranking_score DESC; apps with no score go last
        all_apps.sort(
            key=lambda a: -(a.intibak_table.ranking_score or 0) if a.intibak_table else 0
        )
        # Unique programs present in the ranking data
        programs = sorted({a.target_program for a in all_apps if a.target_program})
        selected_program = request.args.get("program", "all")
        ranked = [a for a in all_apps if a.target_program == selected_program] \
                 if selected_program != "all" else all_apps
        return {
            "ranking_apps": ranked,
            "ranking_programs": programs,
            "selected_program": selected_program,
        }

    if role_slug == "oidb" and tab_slug == "check-documents":
        from ..classes import Oidb
        all_apps = Oidb(user_id, email, "oidb").get_pending_applicants()
        all_apps = [a for a in all_apps if a.status in _OIDB_VISIBLE_STATUSES]
        col_map = {0: "id", 1: "full_name", 2: "target_program", 3: "target_semester",
                   4: "status", 5: "doc_checker_sort_key", 6: "created_at"}
        status_counts = _status_counts(all_apps, ["submitted", "forwarded_to_ydyo", "returned"])
        filtered = _filter_apps(all_apps, filter_status)
        if sort_col is None:
            apps = sorted(filtered, key=_oidb_sort_priority)
        else:
            apps = _sort_apps(filtered, sort_col, sort_dir, col_map)
        return {
            "oidb_applications": apps[offset:offset + per_page],
            "document_slots": APPLICATION_DOCUMENT_SLOTS,
            "pagination": _build_pagination(len(apps), page, per_page),
            "status_counts": status_counts,
            "active_filter": filter_status,
            "active_sort_col": sort_col,
            "active_sort_dir": sort_dir,
        }

    if role_slug == "dean" and tab_slug == "receive-forward-applications":
        from ..classes import DeanOffice
        all_apps = DeanOffice(user_id, email, "dean").get_pending_applicants()
        col_map = {0: "id", 1: "full_name", 2: "target_program", 3: "target_semester",
                   4: "status", 5: "created_at"}
        status_counts = _status_counts(all_apps, ["forwarded_to_dean", "forwarded_to_ygk"])
        apps = _sort_apps(_filter_apps(all_apps, filter_status), sort_col, sort_dir, col_map)
        return {
            "dean_applications": apps[offset:offset + per_page],
            "document_slots": APPLICATION_DOCUMENT_SLOTS,
            "pagination": _build_pagination(len(apps), page, per_page),
            "status_counts": status_counts,
            "active_filter": filter_status,
            "active_sort_col": sort_col,
            "active_sort_dir": sort_dir,
        }

    if role_slug == "ydyo" and tab_slug == "set-prep-school-status":
        from ..classes import Ydyo
        all_apps = Ydyo(user_id, email, "ydyo").get_applications()
        col_map = {0: "id", 1: "full_name", 2: "target_program", 3: "target_semester",
                   5: "doc_checker_status", 6: "created_at"}
        status_counts = _status_counts(all_apps, ["forwarded_to_ydyo"])
        apps = _sort_apps(_filter_apps(all_apps, filter_status), sort_col, sort_dir, col_map)
        return {
            "ydyo_applications": apps[offset:offset + per_page],
            "pagination": _build_pagination(len(apps), page, per_page),
            "status_counts": status_counts,
            "active_filter": filter_status,
            "active_sort_col": sort_col,
            "active_sort_dir": sort_dir,
        }

    if role_slug == "applicant" and tab_slug == "track-application":
        app = (
            ApplicationORM.query
            .options(selectinload(ApplicationORM.documents))
            .filter_by(applicant_id=user_id)
            .first()
        )
        return {
            "applicant_application": app,
            "tracker_steps": APPLICATION_TRACKER_STEPS,
            "status_step": APPLICATION_STATUS_STEP,
            "cancellation_allowed": APPLICATION_CANCELLATION_ALLOWED,
            "resubmission_allowed": APPLICATION_RESUBMISSION_ALLOWED,
        }

    if role_slug == "applicant" and tab_slug == "submit-application":
        app = (
            ApplicationORM.query
            .options(selectinload(ApplicationORM.documents))
            .filter_by(applicant_id=user_id)
            .first()
        )
        return {
            "applicant_application": app,
            "period_open": APPLICATION_SUBMISSION_PERIOD_OPEN,
            "available_programs": AVAILABLE_PROGRAMS,
            "programs_by_faculty": PROGRAMS_BY_FACULTY,
            "available_semesters": AVAILABLE_SEMESTERS,
            "document_slots": APPLICATION_DOCUMENT_SLOTS,
            "resubmission_allowed": APPLICATION_RESUBMISSION_ALLOWED,
        }

    if role_slug == "ygk" and tab_slug == "check-applicants":
        from ..classes import YGK
        all_apps = YGK(user_id, email, "ygk").get_pending_applicants()
        col_map = {
            0: "id", 1: "full_name", 2: "target_program",
            3: "source_university", 4: "current_gpa", 5: "target_semester",
        }
        status_counts = _status_counts(all_apps, ["forwarded_to_ygk", "intibak_complete"])
        apps = _sort_apps(_filter_apps(all_apps, filter_status), sort_col, sort_dir, col_map)
        return {
            "ygk_applications": apps[offset:offset + per_page],
            "pagination": _build_pagination(len(apps), page, per_page),
            "status_counts": status_counts,
            "active_filter": filter_status,
            "active_sort_col": sort_col,
            "active_sort_dir": sort_dir,
        }

    if role_slug == "ygk" and tab_slug == "intibak-table":
        app_id = request.args.get("app_id", type=int)
        dept = session.get("user_department", "computer_engineering")
        curriculum = get_curriculum(dept)
        if app_id:
            from ..classes import YGK
            selected_app = (
                ApplicationORM.query
                .options(
                    selectinload(ApplicationORM.documents),
                    selectinload(ApplicationORM.applicant),
                )
                .get(app_id)
            )
            table_result = YGK(user_id, email, "ygk").get_intibak_table(app_id)
            intibak_table = table_result.data if table_result.success else None
        else:
            selected_app = None
            intibak_table = None

        left_courses = []
        right_courses = []
        taken_courses = []
        if intibak_table:
            left_courses  = [c for c in intibak_table.courses if c.side == "left"]
            right_courses = [c for c in intibak_table.courses if c.side == "right"]
            taken_courses = [c for c in intibak_table.courses if c.side == "taken"]

        # Pre-compute ranking score from applicant's submitted GPA + OSYM (no estimated GPA)
        ranking_score = None
        if selected_app and selected_app.osym_points and selected_app.current_gpa:
            try:
                osym = float(selected_app.osym_points)
                gpa  = float(selected_app.current_gpa)
                ranking_score = round((osym / 560.0) * 90.0 + (gpa / 4.0) * 10.0, 4)
            except (TypeError, ValueError):
                pass
        return {
            "selected_application": selected_app,
            "intibak_table": intibak_table,
            "left_courses": left_courses,
            "right_courses": right_courses,
            "taken_courses": taken_courses,
            "curriculum": curriculum,
            "ranking_score": ranking_score,
        }

    if role_slug == "admin":
        from ..classes import Admin
        admin = Admin(user_id, email, "admin")
        if tab_slug == "user-management":
            return {"admin_users": admin.list_users().data or []}
        if tab_slug == "config":
            return {"admin_config": admin.get_config_summary()}
        if tab_slug == "database":
            return {
                "admin_applications": admin.get_all_applications().data or [],
                "admin_backups": admin.list_backups().data or [],
            }

    return {}


def _enrich_tabs(tabs: list) -> list:
    return [{**t, "slug": _slugify(t["title"])} for t in tabs]


@dashboard_bp.route("/", methods=["GET"])
@login_required
def index():
    role_slug = session.get("user_role")
    email = session.get("user_email")
    _ROLE_DISPLAY = {**{r["slug"]: r["name"] for r in ROLE_DEFINITIONS}, "admin": "Administrator"}
    role_name = _ROLE_DISPLAY.get(role_slug, role_slug)
    if role_slug == "ygk":
        dept_key = session.get("user_department", "")
        if dept_key:
            dept_display = dept_key.replace("_", " ").title()
            role_name = f"YGK – {dept_display} Department"

    return render_template(
        "dashboard.html",
        email=email,
        role_name=role_name,
        role_slug=role_slug,
        tabs=_enrich_tabs(PHASE1_TABS.get(role_slug, [])),
        # Static config kept available for any inline use
        available_programs=AVAILABLE_PROGRAMS,
        available_semesters=AVAILABLE_SEMESTERS,
        available_faculties=AVAILABLE_FACULTIES,
        document_slots=APPLICATION_DOCUMENT_SLOTS,
        cancellation_allowed=APPLICATION_CANCELLATION_ALLOWED,
        resubmission_allowed=APPLICATION_RESUBMISSION_ALLOWED,
        tracker_steps=APPLICATION_TRACKER_STEPS,
        status_step=APPLICATION_STATUS_STEP,
    )


@dashboard_bp.route("/tab/<tab_slug>", methods=["GET"])
@login_required
def tab_content(tab_slug: str):
    """Render a single tab panel as an HTML fragment (lazy-load target)."""
    role_slug = session.get("user_role")
    user_id = session.get("user_id")
    email = session.get("user_email")
    page = max(1, request.args.get("page", 1, type=int))
    filter_status = request.args.get("filter", "all")
    sort_col = request.args.get("sort_col", None, type=int)
    sort_dir = request.args.get("sort_dir", "asc")

    tabs = _enrich_tabs(PHASE1_TABS.get(role_slug, []))
    tab = next((t for t in tabs if t["slug"] == tab_slug), None)
    if not tab:
        return "<p class='subline'>Tab not found.</p>", 404
    if not tab.get("partial"):
        return "<p class='subline'>This section will be available in a future phase.</p>"

    data = _get_tab_data(role_slug, tab_slug, page, user_id, email, filter_status, sort_col, sort_dir)
    return render_template(tab["partial"], **data)
