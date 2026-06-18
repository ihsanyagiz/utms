"""Shared route helpers and access guards."""

from __future__ import annotations

from functools import wraps

from flask import flash, redirect, session, url_for


def login_required(view_func):
    """Ensure there is an authenticated session."""

    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            flash("Please login first.", "error")
            return redirect(url_for("auth.login"))
        return view_func(*args, **kwargs)

    return wrapped


def role_required(role_slug: str):
    """Restrict route access by role."""

    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def wrapped(*args, **kwargs):
            if session.get("user_role") != role_slug:
                flash("You are not authorized to access this area.", "error")
                return redirect(url_for("dashboard.index"))
            return view_func(*args, **kwargs)

        return wrapped

    return decorator
