"""Flask CLI management commands."""

from __future__ import annotations

import click


def register_commands(app) -> None:
    """Attach CLI commands to the Flask app."""

    @app.cli.command("init-admin")
    @click.option("--email", default="admin@admin", show_default=True)
    @click.option("--password", default="admin", show_default=True)
    def init_admin(email: str, password: str) -> None:
        """Create the default admin account if it does not already exist."""
        from . import db
        from .models import UserORM

        existing = UserORM.query.filter_by(email=email, role="admin").first()
        if existing:
            click.echo(f"Admin '{email}' already exists — skipping.")
            return
        user = UserORM(email=email, role="admin")
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        click.echo(f"Admin account created: {email}")

    @app.cli.command("seed-db")
    @click.confirmation_option(prompt="This wipes ALL data and reseeds. Continue?")
    def seed_db() -> None:
        """Wipe the database and load synthetic test data."""
        from . import db
        from .models import (
            ApplicationDocumentORM, ApplicationORM, UserORM,
            IntibakTableORM, IntibakCourseORM,
        )
        seed_all(db, ApplicationDocumentORM, ApplicationORM, UserORM, IntibakTableORM, IntibakCourseORM)
        click.echo("Seed complete. All accounts use password 'test' except admin (password 'admin').")


def seed_all(db, ApplicationDocumentORM, ApplicationORM, UserORM, IntibakTableORM, IntibakCourseORM):
    """Wipe all tables and insert synthetic data. Callable from CLI and admin route."""
    import json as _json
    from datetime import datetime, timedelta

    # Wipe in FK-safe order
    db.session.query(IntibakCourseORM).delete()
    db.session.query(IntibakTableORM).delete()
    db.session.query(ApplicationDocumentORM).delete()
    db.session.query(ApplicationORM).delete()
    db.session.query(UserORM).delete()
    db.session.commit()

    # ── Staff accounts ──────────────────────────────────────────────────────
    staff = [
        ("admin@admin",  "admin", "admin", None),
        ("oidb@test",    "test",  "oidb",  None),
        ("dean@test",    "test",  "dean",  None),
        ("ydyo@test",    "test",  "ydyo",  None),
        # Two YGK users for different departments
        ("ygk.ceng@test", "test", "ygk",  "computer_engineering"),
        ("ygk.elec@test", "test", "ygk",  "electrical_electronics_engineering"),
    ]
    for email, pwd, role, dept in staff:
        u = UserORM(email=email, role=role, department=dept)
        u.set_password(pwd)
        db.session.add(u)
    db.session.flush()

    # ── Checker error payloads ───────────────────────────────────────────────
    _ERR_GPA_LOW = _json.dumps([
        {"type": "field", "field": "current_gpa",
         "reason": "GPA 1.80 is below the minimum required 2.00.", "slot": None},
    ])
    _ERR_DOCS = _json.dumps([
        {"type": "document", "slot": 2, "reason": "Transcript is missing.", "field": None},
        {"type": "document", "slot": 3, "reason": "YKS Score Report is missing.", "field": None},
    ])
    _ERR_ID_DOC = _json.dumps([
        {"type": "field",    "field": "id_number",
         "reason": "ID number must contain only digits.", "slot": None},
        {"type": "document", "slot": 1, "reason": "Student Certificate is missing.", "field": None},
    ])
    _ERR_ENG_DOC = _json.dumps([
        {"type": "document", "slot": 4,
         "reason": "English proficiency certificate is missing.", "field": None},
    ])
    _OK = "[]"

    _UNIS = [
        "Boğaziçi University",
        "Middle East Technical University",
        "Hacettepe University",
        "Ankara University",
        "Ege University",
        "Istanbul Technical University",
        "Koç University",
        "Sabancı University",
        "Bilkent University",
        "Yıldız Technical University",
    ]

    # (full_name, email, status, program, faculty_dept_key,
    #  gpa, osym, checker_status, checker_errors,
    #  oidb_notes, dean_notes, prep_school_status, enrolled, uni_idx)
    scenarios = [
        # ── Submitted — not yet auto-checked ────────────────────────────────
        ("Emre Yıldız",        "emre.yildiz@test",       "submitted",
         "Computer Engineering",             None,
         "3.20", None,      "needs_manual_check", None,          None, None, None, True,  0),

        ("Selin Kaya",         "selin.kaya@test",        "submitted",
         "Electrical-Electronics Engineering", None,
         "3.55", "430.00",  "needs_manual_check", None,          None, None, None, True,  1),

        # ── Submitted — auto-checked with errors ─────────────────────────────
        ("Burak Demir",        "burak.demir@test",       "submitted",
         "Software Engineering",             None,
         "1.80", "310.00",  "auto_checked",       _ERR_GPA_LOW,  None, None, None, True,  2),

        ("Fatma Arslan",       "fatma.arslan@test",      "submitted",
         "Computer Engineering",             None,
         "2.90", None,      "auto_checked",       _ERR_DOCS,     None, None, None, False, 3),

        ("Mert Çelik",         "mert.celik@test",        "submitted",
         "Mechanical Engineering",           None,
         "3.10", "395.00",  "auto_checked",       _ERR_ID_DOC,   None, None, None, True,  4),

        # ── Submitted — auto-checked OK ──────────────────────────────────────
        ("Ayşe Şahin",         "ayse.sahin@test",        "submitted",
         "Computer Engineering",             None,
         "3.40", "420.00",  "auto_checked",       _OK,           None, None, None, True,  5),

        # ── Forwarded to YDYO ───────────────────────────────────────────────
        ("Hakan Öztürk",       "hakan.ozturk@test",      "forwarded_to_ydyo",
         "Software Engineering",             None,
         "3.60", "455.00",  "auto_checked",       _OK,           None, None, None, True,  6),

        ("Zeynep Aydın",       "zeynep.aydin@test",      "forwarded_to_ydyo",
         "Computer Engineering",             None,
         "2.95", "360.00",  "auto_checked",       _ERR_ENG_DOC,  None, None, None, True,  7),

        ("Onur Koç",           "onur.koc@test",          "forwarded_to_ydyo",
         "Electrical-Electronics Engineering", None,
         "3.75", "470.00",  "auto_checked",       _OK,           None, None, None, False, 8),

        # ── Forwarded to Dean ───────────────────────────────────────────────
        ("Merve Doğan",        "merve.dogan@test",       "forwarded_to_dean",
         "Computer Engineering",             None,
         "3.80", "488.00",  "auto_checked",       _OK,           None, None, "eligible", True, 9),

        ("Tolga Polat",        "tolga.polat@test",       "forwarded_to_dean",
         "Software Engineering",             None,
         "3.25", "410.00",  "auto_checked",       _OK,           None, None, "needs_test", True, 0),

        # ── Forwarded to YGK — Computer Engineering ──────────────────────────
        ("İrem Güneş",         "irem.gunes@test",        "forwarded_to_ygk",
         "Computer Engineering",             "computer_engineering",
         "3.90", "495.00",  "auto_checked",       _OK,           None, None, "eligible", True,  1),

        ("Berkay Erdoğan",     "berkay.erdogan@test",    "forwarded_to_ygk",
         "Software Engineering",             "computer_engineering",
         "3.50", "445.00",  "auto_checked",       _OK,           None, None, "eligible", True,  2),

        ("Naz Yılmaz",         "naz.yilmaz@test",        "forwarded_to_ygk",
         "Computer Engineering",             "computer_engineering",
         "3.65", "460.00",  "auto_checked",       _OK,           None, None, "needs_test", False, 3),

        # ── Intibak complete — full pipeline ─────────────────────────────────
        ("Alper Tan",          "alper.tan@test",         "intibak_complete",
         "Computer Engineering",             "computer_engineering",
         "3.70", "472.00",  "auto_checked",       _OK,           None, None, "eligible", True,  4),

        ("Ceren Özdemir",      "ceren.ozdemir@test",     "intibak_complete",
         "Software Engineering",             "computer_engineering",
         "3.85", "491.00",  "auto_checked",       _OK,           None, None, "eligible", True,  5),

        ("Yusuf Aktaş",        "yusuf.aktas@test",       "intibak_complete",
         "Computer Engineering",             "computer_engineering",
         "3.45", "438.00",  "auto_checked",       _OK,           None, None, "needs_test", True, 6),

        ("Gizem Sarı",         "gizem.sari@test",        "intibak_complete",
         "Computer Engineering",             "computer_engineering",
         "4.00", "510.00",  "auto_checked",       _OK,           None, None, "eligible", True,  7),

        # ── Returned by OIDB ─────────────────────────────────────────────────
        ("Kaan Acar",          "kaan.acar@test",         "returned",
         "Computer Engineering",             None,
         "2.50", None,      "needs_manual_check", None,
         "Official transcript is missing the notary stamp.",
         None, None, True, 8),

        ("Eda Bozkurt",        "eda.bozkurt@test",       "returned",
         "Mechanical Engineering",           None,
         "3.05", "388.00",  "auto_checked",       _OK,
         "Student certificate must be issued within the last 6 months.",
         None, None, False, 9),

        # ── Returned by Dean to applicant ────────────────────────────────────
        ("Serkan Yurt",        "serkan.yurt@test",       "returned",
         "Software Engineering",             None,
         "3.30", "415.00",  "auto_checked",       _OK,
         None,
         "Please provide a notarised copy of your diploma from a sworn translator.",
         None, True, 0),

        # ── Returned by Dean to OIDB (re-entered as submitted) ───────────────
        ("Dilara Kurt",        "dilara.kurt@test",       "submitted",
         "Computer Engineering",             None,
         "3.15", "402.00",  "auto_checked",       _OK,
         None,
         "Transcript verification required — please re-check before forwarding.",
         None, True, 1),

        # ── Returned by Dean to YDYO (re-entered as forwarded_to_ydyo) ───────
        ("Kerem Çakır",        "kerem.cakir@test",       "forwarded_to_ydyo",
         "Electrical-Electronics Engineering", None,
         "3.48", "442.00",  "auto_checked",       _OK,
         None,
         "English proficiency document needs re-evaluation by YDYO.",
         None, True, 2),

        # ── Cancelled ───────────────────────────────────────────────────────
        ("Pınar Güler",        "pinar.guler@test",       "cancelled",
         "Architecture",                     None,
         "2.75", None,      "needs_manual_check", None,          None, None, None, True,  3),
    ]

    base_date = datetime.utcnow() - timedelta(days=len(scenarios))
    app_objects = {}  # email → ApplicationORM (for building intibak tables later)

    for idx, row in enumerate(scenarios):
        (full_name, email, status, program, faculty_key,
         gpa, osym, checker_status, checker_errors,
         oidb_notes, dean_notes, prep_status, enrolled, uni_idx) = row

        u = UserORM(email=email, role="applicant")
        u.set_password("test")
        db.session.add(u)
        db.session.flush()

        id_num = f"1234{idx:05d}" if "INVALID" not in email else "TC-INVALID-XYZ"
        app_obj = ApplicationORM(
            applicant_id=u.id,
            full_name=full_name,
            id_number=id_num,
            student_number=id_num,
            source_university=_UNIS[uni_idx % len(_UNIS)],
            is_currently_enrolled=enrolled,
            target_program=program,
            target_department=program,
            target_semester="2026–2027 / Fall",
            current_gpa=gpa,
            osym_points=osym,
            status=status,
            oidb_notes=oidb_notes,
            dean_notes=dean_notes,
            forwarded_faculty=faculty_key,
            prep_school_status=prep_status,
            doc_checker_status=checker_status,
            doc_checker_errors=checker_errors,
            created_at=base_date + timedelta(days=idx),
        )
        db.session.add(app_obj)
        db.session.flush()
        app_objects[email] = app_obj

    db.session.commit()

    # ── Intibak tables for intibak_complete applicants ──────────────────────
    # Courses are realistic CE curriculum rows; ranking_score computed from formula:
    # score = (osym / 560) * 90 + (gpa / 4.0) * 10
    intibak_scenarios = {
        "alper.tan@test": {
            "estimated_gpa": 3.55,
            "courses": [
                # (side, code, name, credits, akts, grade)
                ("left",  "BLM201", "Data Structures",           "4", "6",  "BA"),
                ("left",  "BLM301", "Algorithms",                "3", "5",  "BB"),
                ("left",  "MAT101", "Calculus I",                "4", "6",  "AA"),
                ("left",  "MAT102", "Calculus II",               "4", "6",  "CB"),
                ("left",  "FZK101", "Physics I",                 "4", "6",  "BB"),
                ("right", "CENG112", "Data Structures",          "3", "5",  None),
                ("right", "MATH141", "Calculus I",               "4", "5",  None),
                ("right", "PHYS121", "General Physics I",        "4", "7",  None),
                ("taken", "CENG113", "Programming Basics",       "4", "6",  None),
                ("taken", "CENG115", "Discrete Structures",      "3", "5",  None),
            ],
        },
        "ceren.ozdemir@test": {
            "estimated_gpa": 3.70,
            "courses": [
                ("left",  "CS201",  "Introduction to Programming","3", "5",  "AA"),
                ("left",  "CS301",  "Object-Oriented Programming","3", "5",  "BA"),
                ("left",  "CS401",  "Database Systems",           "3", "5",  "BB"),
                ("left",  "MTH201", "Discrete Mathematics",       "3", "5",  "AA"),
                ("left",  "ENG205", "Signals & Systems",          "3", "5",  "CB"),
                ("right", "CENG211", "Programming Fundamentals",  "3", "5",  None),
                ("right", "CENG115", "Discrete Structures",      "3", "5",  None),
                ("right", "MATH141", "Calculus I",               "4", "5",  None),
                ("taken", "CENG112", "Data Structures",          "3", "5",  None),
                ("taken", "CENG212", "Concepts of Programming Languages", "3", "5", None),
                ("taken", "PHYS121", "General Physics I",        "4", "7",  None),
            ],
        },
        "yusuf.aktas@test": {
            "estimated_gpa": 3.20,
            "courses": [
                ("left",  "BLG201", "Data Structures & Algorithms","4","6",  "CB"),
                ("left",  "BLG101", "Introduction to Programming", "3","5",  "BB"),
                ("left",  "MTH101", "Calculus I",                  "4","6",  "BB"),
                ("right", "CENG112", "Data Structures",            "3","5",  None),
                ("right", "MATH141", "Calculus I",                 "4","5",  None),
                ("taken", "CENG113", "Programming Basics",         "4","6",  None),
                ("taken", "CENG211", "Programming Fundamentals",   "3","5",  None),
                ("taken", "CENG115", "Discrete Structures",        "3","5",  None),
                ("taken", "CENG214", "Logic Design",               "4","6",  None),
            ],
        },
        "gizem.sari@test": {
            "estimated_gpa": 3.90,
            "courses": [
                ("left",  "BLM101", "Intro to Computer Engineering","3","5", "AA"),
                ("left",  "BLM102", "Programming I",               "4","6",  "AA"),
                ("left",  "BLM201", "Data Structures",             "4","6",  "AA"),
                ("left",  "BLM202", "Discrete Math",               "3","5",  "AA"),
                ("left",  "MAT101", "Calculus I",                  "4","6",  "AA"),
                ("left",  "MAT102", "Calculus II",                 "4","6",  "AA"),
                ("left",  "FZK101", "Physics I",                   "4","6",  "BA"),
                ("right", "CENG111", "Concepts in Computer Engineering","3","5",None),
                ("right", "CENG113", "Programming Basics",         "4","6",  None),
                ("right", "CENG112", "Data Structures",            "3","5",  None),
                ("right", "CENG115", "Discrete Structures",        "3","5",  None),
                ("right", "MATH141", "Calculus I",                 "4","5",  None),
                ("right", "MATH142", "Calculus II",                "4","6",  None),
                ("right", "PHYS121", "General Physics I",          "4","7",  None),
                ("taken", "CENG211", "Programming Fundamentals",   "3","5",  None),
            ],
        },
    }


    def _ranking_score(osym_str, gpa_str):
        try:
            osym = float(osym_str) if osym_str else None
            gpa  = float(gpa_str)  if gpa_str  else None
            if osym is None or gpa is None:
                return None
            return round((osym / 560.0) * 90.0 + (gpa / 4.0) * 10.0, 4)
        except (TypeError, ValueError):
            return None

    for email, data in intibak_scenarios.items():
        app_obj = app_objects.get(email)
        if not app_obj:
            continue
        table = IntibakTableORM(
            application_id=app_obj.id,
            estimated_gpa=data["estimated_gpa"],
            ranking_score=_ranking_score(app_obj.osym_points, app_obj.current_gpa),
        )
        db.session.add(table)
        db.session.flush()

        for pos, (side, code, name, credits, akts, grade) in enumerate(data["courses"]):
            row = IntibakCourseORM(
                intibak_table_id=table.id,
                side=side,
                course_name=name,
                course_code=code,
                credits=credits,
                akts=akts,
                grade=grade,
                position=pos,
            )
            db.session.add(row)

    db.session.commit()
