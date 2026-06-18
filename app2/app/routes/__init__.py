"""Application route package and blueprint registration."""

from __future__ import annotations

from flask import Flask

from .admin import admin_bp
from .applicant import applicant_api_bp
from .auth import auth_bp
from .dashboard import dashboard_bp
from .dean import dean_api_bp
from .oidb import oidb_api_bp
from .ydyo import ydyo_api_bp
from .ygk import ygk_api_bp


def register_blueprints(app: Flask) -> None:
    """Register all top-level and role-restricted blueprints."""
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)

    app.register_blueprint(admin_bp)
    app.register_blueprint(applicant_api_bp)
    app.register_blueprint(oidb_api_bp)
    app.register_blueprint(dean_api_bp)
    app.register_blueprint(ygk_api_bp)
    app.register_blueprint(ydyo_api_bp)
