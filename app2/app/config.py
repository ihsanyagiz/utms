"""Application constants and Phase 1 shell configuration."""

from .programs import PROGRAMS_BY_FACULTY, AVAILABLE_PROGRAMS

ROLE_DEFINITIONS = [
    {"name": "Applicant", "slug": "applicant"},
    {"name": "OIDB", "slug": "oidb"},
    {"name": "Dean", "slug": "dean"},
    {"name": "YGK", "slug": "ygk"},
    {"name": "YDYO", "slug": "ydyo"},
]

APPLICATION_SUBMISSION_PERIOD_OPEN = True
APPLICATION_CANCELLATION_ALLOWED = True
APPLICATION_RESUBMISSION_ALLOWED = True
APPLICATION_UPLOAD_SUBDIR = "uploads/applications"

APPLICATION_DOCUMENT_SLOTS = [
    {"slot": 1, "label": "Student Certificate"},
    {"slot": 2, "label": "Transcript"},
    {"slot": 4, "label": "English Proficiency Certificate"},
    {"slot": 3, "label": "OSYM Points"},
    {"slot": 5, "label": "OSYM Certificate"},
]
APPLICATION_REQUIRED_DOCUMENT_SLOTS = [s["slot"] for s in APPLICATION_DOCUMENT_SLOTS if not s.get("optional")]

AVAILABLE_FACULTIES = [
    "Faculty of Science",
    "Faculty of Engineering",
    "Faculty of Architecture",
]

AVAILABLE_SEMESTERS = [
    "2026–2027 / Fall",
    "2026–2027 / Spring",
]

# Ordered steps for the applicant status tracker
APPLICATION_TRACKER_STEPS = [
    "OIDB Check",
    "YDYO Check",
    "Dean Review",
    "YGK Intibak",
    "OIDB Ranking",
]

# Maps application.status → tracker step index (0-based).
# "returned" step is resolved in the template from notes (0 = OIDB, 2 = Dean).
APPLICATION_STATUS_STEP = {
    "submitted": 0,
    "forwarded_to_ydyo": 1,
    "forwarded_to_dean": 2,
    "forwarded_to_ygk": 3,
    "intibak_complete": 4,
    "returned": 0,       # fallback; template overrides from notes
    "cancelled": -1,
}

PHASE1_TABS = {
    "applicant": [
        {
            "title": "Submit Application",
            "description": "Submit required documents and personal information.",
            "endpoint": "applicant_api.submit_documents",
            "period_open": APPLICATION_SUBMISSION_PERIOD_OPEN,
            "partial": "partials/panel_applicant_submit.html",
        },
        {
            "title": "Track Application",
            "description": "View your transfer application status and timeline.",
            "endpoint": "applicant_api.track_application",
            "period_open": True,
            "partial": "partials/panel_applicant_track.html",
        },
    ],
    "oidb": [
        {
            "title": "Check Documents",
            "description": "Review submitted applications and verify documents.",
            "endpoint": "oidb_api.check_documents",
            "partial": "partials/panel_oidb_documents.html",
        },
        {
            "title": "Create Ranking Table",
            "description": "Sort intibak-complete applicants by ranking score per program.",
            "endpoint": "oidb_api.create_ranking_table",
            "partial": "partials/panel_oidb_ranking.html",
        },
    ],
    "dean": [
        {
            "title": "Receive & Forward Applications",
            "description": "Review and forward applications to YGK.",
            "endpoint": "dean_api.check_applicants",
            "partial": "partials/panel_dean_applications.html",
        },
    ],
    "ygk": [
        {
            "title": "Check Applicants",
            "description": "Review applications forwarded to your department.",
            "endpoint": "ygk_api.view_document",
            "partial": "partials/panel_ygk_applicants.html",
        },
        {
            "title": "Intibak Table",
            "description": "Build course equivalency table for a selected applicant.",
            "endpoint": "ygk_api.view_document",
            "partial": "partials/panel_ygk_intibak.html",
        },
    ],
    "ydyo": [
        {
            "title": "Set Prep School Status",
            "description": "Review English proficiency documents and mark each applicant's prep school requirement.",
            "endpoint": "ydyo_api.check_documents",
            "partial": "partials/panel_ydyo_documents.html",
        },
    ],
    "admin": [
        {
            "title": "User Management",
            "description": "View all users and change their roles.",
            "endpoint": "admin_api.change_user_role",
            "partial": "partials/panel_admin_users.html",
        },
        {
            "title": "Config",
            "description": "Current feature flag values.",
            "endpoint": "admin_api.trigger_backup",
            "partial": "partials/panel_admin_config.html",
        },
        {
            "title": "Database",
            "description": "Application records and backup.",
            "endpoint": "admin_api.trigger_backup",
            "partial": "partials/panel_admin_database.html",
        },
    ],
}
