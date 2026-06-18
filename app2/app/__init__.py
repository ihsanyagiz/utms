from pathlib import Path
import os
from datetime import datetime

from flask import Flask, redirect, render_template, url_for
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event as sa_event, text

from .config import APPLICATION_UPLOAD_SUBDIR, ROLE_DEFINITIONS

db = SQLAlchemy()


@sa_event.listens_for(db.session, "before_flush")
def _auto_fingerprint_application(session, flush_context, instances):
    """Auto-set last_edited_by_id / last_edited_at whenever an ApplicationORM is flushed."""
    try:
        from flask import session as flask_session
        user_id = flask_session.get("user_id")
    except RuntimeError:
        # Outside a request context (startup, CLI, tests without request)
        return
    if user_id is None:
        return
    from .models import ApplicationORM
    now = datetime.utcnow()
    for obj in list(session.dirty) + list(session.new):
        if isinstance(obj, ApplicationORM):
            obj.last_edited_by_id = user_id
            obj.last_edited_at = now


def _ensure_user_department_column():
    """Add department column to user table on existing SQLite databases."""
    with db.engine.begin() as conn:
        table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
        ).fetchone()
        if not table_exists:
            return
        columns = conn.execute(text('PRAGMA table_info("user")')).fetchall()
        column_names = {col[1] for col in columns}
        if "department" not in column_names:
            conn.execute(text('ALTER TABLE "user" ADD COLUMN department VARCHAR(120)'))


def _ensure_user_role_column():
    # Keep old SQLite files compatible with the new role-based user model.
    with db.engine.begin() as conn:
        table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
        ).fetchone()

        if not table_exists:
            return

        columns = conn.execute(text('PRAGMA table_info("user")')).fetchall()
        column_names = {col[1] for col in columns}

        if 'role' not in column_names:
            conn.execute(
                text('ALTER TABLE "user" ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT "applicant"')
            )


def _ensure_application_new_columns():
    with db.engine.begin() as conn:
        table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='application'")
        ).fetchone()
        if not table_exists:
            return

        columns = conn.execute(text('PRAGMA table_info("application")')).fetchall()
        column_names = {col[1] for col in columns}

        additions = {
            "id_number": 'VARCHAR(64) NOT NULL DEFAULT ""',
            "target_program": 'VARCHAR(120) NOT NULL DEFAULT ""',
            "target_semester": 'VARCHAR(32) NOT NULL DEFAULT ""',
            "is_currently_enrolled": "BOOLEAN NOT NULL DEFAULT 0",
            "oidb_notes": "TEXT",
            "prep_school_status": "VARCHAR(32)",
            "forwarded_faculty": 'VARCHAR(120)',
            "last_edited_by_id": "INTEGER",
            "last_edited_at": "DATETIME",
            "osym_points": "VARCHAR(16)",
            "doc_checker_status": "VARCHAR(32) DEFAULT 'needs_manual_check'",
            "doc_checker_errors": "TEXT",
            "dean_notes": "TEXT",
        }
        for col_name, col_def in additions.items():
            if col_name not in column_names:
                conn.execute(text(f'ALTER TABLE "application" ADD COLUMN {col_name} {col_def}'))

def _ensure_intibak_estimated_gpa_column():
    with db.engine.begin() as conn:
        exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='intibak_table'")
        ).fetchone()
        if not exists:
            return
        cols = {r[1] for r in conn.execute(text("PRAGMA table_info(intibak_table)")).fetchall()}
        if "estimated_gpa" not in cols:
            conn.execute(text("ALTER TABLE intibak_table ADD COLUMN estimated_gpa FLOAT"))
        if "ranking_score" not in cols:
            conn.execute(text("ALTER TABLE intibak_table ADD COLUMN ranking_score FLOAT"))


def create_app(test_config: dict | None = None):
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "utms-1234")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["APPLICATION_UPLOAD_FOLDER"] = str(Path(app.instance_path) / APPLICATION_UPLOAD_SUBDIR)
    app.config["DEPLOY_WEBHOOK_SECRET"] = os.environ.get("DEPLOY_WEBHOOK_SECRET", "")
    app.config["DEPLOY_WEBHOOK_COMMAND"] = os.environ.get("DEPLOY_WEBHOOK_COMMAND", "")
    app.config["DEPLOY_WEBHOOK_TIMEOUT"] = int(os.environ.get("DEPLOY_WEBHOOK_TIMEOUT", "300"))

    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    from .database import init_database_interfaces

    init_database_interfaces(app)
    from .routes import register_blueprints

    register_blueprints(app)

    @app.route("/")
    def home():
        return render_template("index.html", roles=ROLE_DEFINITIONS)

    @app.route("/portals/<role_slug>/")
    def role_entry(role_slug):
        # Redirect role entries to separated auth portals.
        if role_slug == "applicant":
            return redirect(url_for("auth.applicant_login"))
        return redirect(url_for("auth.staff_login", role=role_slug))

    from .cli import register_commands
    register_commands(app)

    with app.app_context():
        Path(app.config["APPLICATION_UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)
        db.create_all()
        _ensure_user_role_column()
        _ensure_user_department_column()
        _ensure_application_new_columns()
        _ensure_intibak_estimated_gpa_column()

    return app