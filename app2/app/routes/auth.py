"""Authentication blueprint for all roles."""

from __future__ import annotations

from flask import Blueprint, flash, redirect, render_template, request, session, url_for

from ..services.auth_service import AuthService
from ..config import ROLE_DEFINITIONS

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
STAFF_ROLE_DEFINITIONS = [role for role in ROLE_DEFINITIONS if role["slug"] != "applicant"]
_STAFF_SLUGS = {role["slug"] for role in STAFF_ROLE_DEFINITIONS}


def _render_login(template_context: dict):
    return render_template("login.html", **template_context)


def _render_register(template_context: dict):
    return render_template("register.html", **template_context)


def _redirect_if_authenticated():
    if session.get("user_id"):
        return redirect(url_for("dashboard.index"))
    return None


def _set_session(user) -> None:
    """Store user info in session."""
    session["user_id"] = user.id
    session["user_email"] = user.email
    session["user_role"] = user.role
    session["user_department"] = getattr(user, "department", None)


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """Backward-compatible register entry; defaults to staff auth."""
    if session.get("user_id"):
        return redirect(url_for("dashboard.index"))
    return redirect(url_for("auth.staff_register"))


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    """Backward-compatible login entry route."""
    if session.get("user_id"):
        return redirect(url_for("dashboard.index"))
    target_role = request.args.get("role")
    if target_role == "applicant":
        return redirect(url_for("auth.applicant_login"))
    if target_role in _STAFF_SLUGS:
        return redirect(url_for("auth.staff_login", role=target_role))
    return redirect(url_for("auth.staff_login"))


@auth_bp.route("/applicant", methods=["GET"])
def applicant_portal():
    """Applicant auth entry point."""
    if session.get("user_id"):
        return redirect(url_for("dashboard.index"))
    return redirect(url_for("auth.applicant_login"))


@auth_bp.route("/staff", methods=["GET"])
def staff_portal():
    """Staff auth entry point."""
    if session.get("user_id"):
        return redirect(url_for("dashboard.index"))
    return redirect(url_for("auth.staff_login"))


@auth_bp.route("/applicant/register", methods=["GET", "POST"])
def applicant_register():
    """Registration dedicated to applicants."""
    already_authenticated = _redirect_if_authenticated()
    if already_authenticated:
        return already_authenticated

    service = AuthService()

    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password") or ""
        password_confirm = request.form.get("password_confirm") or ""

        # Validate credentials format
        result = service.validate_credentials(email, password)
        if not result.success:
            flash(result.error_msg, "error")
            return redirect(url_for("auth.applicant_register"))

        # Register user
        result = service.register(email, password, password_confirm, role="applicant", check_validity=True)
        if not result.success:
            flash(result.error_msg, "error")
            return redirect(url_for("auth.applicant_register"))

        flash("Registration successful. Please login.", "success")
        return redirect(url_for("auth.applicant_login"))

    return _render_register(
        {
            "page_title": "Applicant Register",
            "form_title": "Create Applicant Account",
            "submit_label": "Register as Applicant",
            "show_role_selector": False,
            "role_value": "applicant",
            "login_link_endpoint": "auth.applicant_login",
        }
    )


@auth_bp.route("/applicant/login", methods=["GET", "POST"])
def applicant_login():
    """Login dedicated to applicants."""
    already_authenticated = _redirect_if_authenticated()
    if already_authenticated:
        return already_authenticated

    service = AuthService()

    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password") or ""

        # Validate credentials format
        result = service.validate_credentials(email, password)
        if not result.success:
            flash(result.error_msg, "error")
            return redirect(url_for("auth.applicant_login"))

        # Authenticate user
        result = service.login(email, password, role="applicant")
        if not result.success:
            flash(result.error_msg, "error")
            return redirect(url_for("auth.applicant_login"))

        # Set session
        user = result.data
        _set_session(user)
        return redirect(url_for("dashboard.index"))

    return _render_login(
        {
            "page_title": "Applicant Login",
            "form_title": "Applicant Personal Login",
            "submit_label": "Login as Applicant",
            "show_role_selector": False,
            "role_value": "applicant",
            "register_link_endpoint": "auth.applicant_register",
        }
    )


@auth_bp.route("/staff/register", methods=["GET", "POST"])
def staff_register():
    """Staff self-registration is disabled — accounts are created by an admin."""
    flash("Staff accounts are managed by the system administrator. Contact your admin to get an account.", "warning")
    return redirect(url_for("auth.staff_login"))


@auth_bp.route("/staff/login", methods=["GET", "POST"])
def staff_login():
    """Login dedicated to staff roles."""
    already_authenticated = _redirect_if_authenticated()
    if already_authenticated:
        return already_authenticated

    service = AuthService()

    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password") or ""
        role = request.form.get("role") or ""

        # Validate role
        if role not in _STAFF_SLUGS:
            flash("Invalid role selected.", "error")
            return redirect(url_for("auth.staff_login"))

        # Validate credentials format
        result = service.validate_credentials(email, password)
        if not result.success:
            flash(result.error_msg, "error")
            return redirect(url_for("auth.staff_login"))

        # Authenticate user
        result = service.login(email, password, role=role)
        if not result.success:
            flash(result.error_msg, "error")
            return redirect(url_for("auth.staff_login", role=role))

        # Set session
        user = result.data
        _set_session(user)
        return redirect(url_for("dashboard.index"))

    return _render_login(
        {
            "page_title": "Staff Login",
            "form_title": "Staff Workspace Login",
            "submit_label": "Login to Staff Workspace",
            "show_role_selector": True,
            "roles": STAFF_ROLE_DEFINITIONS,
            "role_value": request.args.get("role", ""),
            "register_link_endpoint": None,
        }
    )


@auth_bp.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    """Admin login — not linked from the public portal, navigate directly."""
    already_authenticated = _redirect_if_authenticated()
    if already_authenticated:
        return already_authenticated

    service = AuthService()

    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password") or ""

        result = service.validate_credentials(email, password)
        if not result.success:
            flash(result.error_msg, "error")
            return redirect(url_for("auth.admin_login"))

        result = service.login(email, password, role="admin")
        if not result.success:
            flash(result.error_msg, "error")
            return redirect(url_for("auth.admin_login"))

        user = result.data
        _set_session(user)
        return redirect(url_for("dashboard.index"))

    return _render_login(
        {
            "page_title": "Admin Login",
            "form_title": "Administrator Login",
            "submit_label": "Login as Administrator",
            "show_role_selector": False,
            "role_value": "admin",
            "register_link_endpoint": None,
        }
    )


@auth_bp.route("/logout", methods=["GET"])
def logout():
    """Clear auth session."""
    session.clear()
    return redirect(url_for("home"))
