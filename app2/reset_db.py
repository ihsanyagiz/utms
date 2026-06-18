#!/usr/bin/env python3
"""
Reset the database and uploads folder, then reseed with synthetic data.

Run from the app2/ directory:
    python reset_db.py

What it does:
  1. Drops and recreates all database tables (project.db)
  2. Removes all files inside instance/uploads/
  3. Seeds synthetic applicant, staff, and intibak data
"""

import shutil
import sys
from pathlib import Path

# Must run from app2/
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

from app import create_app, db
from app.models import (
    ApplicationDocumentORM, ApplicationORM, UserORM,
    IntibakTableORM, IntibakCourseORM,
)
from app.cli import seed_all

app = create_app()

with app.app_context():
    # ── Wipe uploads ────────────────────────────────────────────────────────
    uploads_dir = Path(app.config["APPLICATION_UPLOAD_FOLDER"])
    if uploads_dir.exists():
        for item in uploads_dir.iterdir():
            if item.is_file():
                item.unlink()
            elif item.is_dir():
                shutil.rmtree(item)
        print(f"Uploads cleared: {uploads_dir}")
    else:
        print(f"Uploads dir not found, skipping: {uploads_dir}")

    # ── Reseed ──────────────────────────────────────────────────────────────
    seed_all(db, ApplicationDocumentORM, ApplicationORM, UserORM, IntibakTableORM, IntibakCourseORM)
    print("Database reseeded.")
    print()
    print("Staff accounts (password shown):")
    print("  admin@admin   / admin")
    print("  oidb@test     / test")
    print("  dean@test     / test")
    print("  ydyo@test     / test")
    print("  ygk.ceng@test / test  (dept: computer_engineering)")
    print("  ygk.elec@test / test  (dept: electrical_electronics_engineering)")
    print()
    print("Applicant accounts: <name>@test / test  (24 applicants)")
