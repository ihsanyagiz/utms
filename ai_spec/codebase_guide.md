# Codebase Guide

This file explains where things live and why, so that new code goes in the right layer the first time. UTMS uses a three-layer architecture: **Services** (business orchestration) → **Classes** (domain logic) → **Repositories** (data access).

---

## Layer Overview

```
app/
├── core/
│   ├── result.py       ← OperationResult[T], ErrorCode enum (NO exceptions)
│   └── __init__.py
├── services/           ← Service layer
│   ├── base_service.py ← BaseService with error(), ok(), validate_required_fields()
│   ├── application_service.py ← Submit, resubmit, cancel operations
│   ├── auth_service.py ← Login, register, password_reset
│   ├── user_service.py ← User operations
│   └── __init__.py
├── classes/            ← Role classes with business logic
│   ├── users/
│   │   ├── base.py     ← Abstract User class
│   │   ├── admin.py        ← Admin role (user mgmt, config, DB backup/restore)
│   │   ├── applicant.py    ← Applicant role (submit, track)
│   │   ├── dean.py         ← DeanOffice role (review, return to applicant/OIDB/YDYO, forward to YGK)
│   │   ├── oidb.py         ← Oidb role (document verification)
│   │   ├── ydyo.py         ← Ydyo role (prep school marking)
│   │   ├── ygk.py          ← YGK role (intibak table CRUD, GPA/ranking save, approve for OIDB)
│   │   └── __init__.py
│   ├── intibak_exporter.py ← IntibakExporter: to_dict() / to_json() for an intibak table
│   ├── auth.py         ← Auth class (credentials, tokens)
│   └── interfaces.py   ← IReviewer, IDocumentHandler abstract bases
├── curricula/          ← Per-department curriculum data
│   ├── __init__.py     ← CURRICULA dict, PROGRAM_DEPARTMENT_MAP, get_curriculum(), get_department_for_program()
│   └── computer_engineering.py ← 43 CE courses (CENG/MATH/PHYS/ENG/ATA)
├── database/           ← Repository pattern
│   ├── application_repository.py ← ApplicationRepository (all ApplicationORM queries)
│   ├── intibak_repository.py ← IntibakRepository (IntibakTableORM + IntibakCourseORM)
│   ├── interfaces.py   ← ILowLevelDatabase, IHighLevelDatabase, IUserRepository
│   ├── adapters.py     ← SQLAlchemyUserDataService (implements IUserRepository)
│   └── __init__.py
├── models/             ← SQLAlchemy ORM (data shape only, no logic)
│   ├── user.py         ← UserORM (includes `department` VARCHAR for YGK routing)
│   ├── application.py  ← ApplicationORM, ApplicationDocumentORM
│   ├── intibak.py      ← IntibakTableORM, IntibakCourseORM
│   └── __init__.py
├── routes/             ← Thin HTTP controllers
│   ├── admin.py        ← Admin API (role changes, backup, restore)
│   ├── auth.py         ← Login, register endpoints (includes /auth/admin/login)
│   ├── applicant.py    ← Submit, resubmit, cancel (uses ApplicationService)
│   ├── dean.py         ← Review, return to applicant/OIDB/YDYO, forward to YGK
│   ├── oidb.py         ← Verify docs, forward to YDYO
│   ├── ydyo.py         ← Mark prep school, forward
│   ├── ygk.py          ← Approve applications
│   ├── dashboard.py    ← Dashboard page load, tab data gathering
│   ├── common.py       ← Shared decorators (@login_required, @role_required)
│   └── __init__.py
├── cli.py              ← Flask CLI management commands (init-admin, seed-db)
├── programs.py         ← PROGRAMS_BY_FACULTY dict + AVAILABLE_PROGRAMS flat list (source of truth for program data)
├── static/
│   ├── css/
│   │   ├── main.css        ← Toast styling, global layout
│   │   ├── auth.css        ← Auth page centering
│   │   └── dashboard.css   ← Dashboard tab system
│   └── js/
│       └── dashboard.js    ← Tab switching, filters, sorting, expand rows, confirm modal
├── templates/
│   ├── base.html       ← Page shell with nav, flash messages
│   ├── dashboard.html  ← Tab system (auto-includes partials)
│   ├── login.html, register.html, etc. ← Standalone pages
│   └── partials/       ← Dashboard tab content fragments
│       ├── panel_applicant_*.html
│       ├── panel_oidb_documents.html
│       ├── panel_admin_users.html
│       ├── panel_admin_config.html
│       ├── panel_admin_database.html
│       └── ...
├── __init__.py         ← create_app(), db initialization, auto-fingerprint listener
└── config.py           ← PHASE1_TABS, imports from programs.py, feature flags
```

The project root also has:
- `run.py` — Flask app entry point
- `entrypoint.sh` — Docker startup script (runs `init-admin` then starts server)
- `Dockerfile` — uses `entrypoint.sh` as CMD

---

## ORM Model Naming Convention

ORM model class names carry the `ORM` suffix so they are never confused with domain entities (in `classes/entities/`) or service-layer objects.

| ORM Class | SQLAlchemy table | File |
|---|---|---|
| `UserORM` | `user` | `models/user.py` |
| `ApplicationORM` | `application` | `models/application.py` |
| `ApplicationDocumentORM` | `application_document` | `models/application.py` |
| `IntibakTableORM` | `intibak_table` | `models/intibak.py` |
| `IntibakCourseORM` | `intibak_course` | `models/intibak.py` |

**Rule**: When a class name does not match the default SQLAlchemy snake-case derivation, you MUST declare `__tablename__` explicitly. All three models above have it. If you add a new ORM model, always declare `__tablename__` to prevent silent table-name drift.

```python
class SomethingNewORM(db.Model):
    __tablename__ = "something_new"   # always explicit
    ...
```

---

## The Three-Layer Architecture

### Layer 1: `routes/` — HTTP Controllers (Thin)
Routes are stateless HTTP handlers that:
1. Parse the request (form data, URL params)
2. Call ONE service/class method
3. Handle the OperationResult (success or error)
4. Flash message to user
5. Redirect or render

```python
# Correct pattern (all routes follow this):
@applicant_api.route("/submit-documents", methods=["POST"])
@login_required
def submit_documents():
    service = get_application_service(session["user_id"])
    result = service.submit_application(request.form, request.files)
    
    if result.success:
        flash("Application submitted successfully.", "success")  # Static message
    else:
        flash(result.error_msg, "error")  # Error already formatted by business layer
    
    return redirect(url_for("applicant_api.submit_documents"))
```

**Route Rules**:
- ❌ NO business logic, NO database queries, NO file processing
- ✅ Call service/class method and handle OperationResult
- ✅ Display static success messages (hardcoded, not extracted from result.data)
- ✅ Display error messages from result.error_msg (already formatted by business layer)
- ✅ Never use isinstance checks (result.data type is guaranteed by OperationResult contract)

### Layer 2: `services/` — Business Orchestration
Services orchestrate business operations by:
1. Validating inputs
2. Calling business classes and repositories
3. Handling errors with specific ErrorCodes
4. Returning OperationResult[T] with typed data

**Service Rules**:
- ✅ Return ALL methods as OperationResult[T]
- ✅ Use specific ErrorCodes (VALIDATION_FAILED, NOT_FOUND, etc.)
- ✅ Provide user-friendly error messages in result.error_msg
- ✅ Return business objects in result.data (ApplicationORM, ApplicationDocumentORM, UserORM)
- ❌ NO exception throwing (use ErrorCode instead)

### Layer 3: `classes/` — Domain Logic
Role classes (`Applicant`, `DeanOffice`, `Admin`, etc.) implement domain rules:
- State transitions (can only forward if status is correct)
- Business validations (GPA ranges, document requirements)
- Data mutations (forward application, mark as reviewed)

All access to data goes through repositories (`ApplicationRepository`, `get_user_repository()`).

```python
class Oidb(User):
    def return_application(self, application_id, notes):
        app_repo = get_application_repository()
        result = app_repo.find_by_id(application_id)
        if not result.success:
            return result
        app = result.data
        if app.status != "forwarded_to_oidb":
            return OperationResult.error(
                ErrorCode.INVALID_STATUS_TRANSITION,
                f"Cannot return application in status '{app.status}'"
            )
        app.status = "returned"
        app.return_notes = notes
        return app_repo.update(app)
```

**Class Rules**:
- ✅ ALL methods return OperationResult[T]
- ✅ Instantiated per request with user context: `Oidb(user_id, email, "oidb")`
- ✅ Use repositories for ALL data access (no direct db.session)
- ❌ NO direct db.session, NO exception throwing

### Layer 4: `database/` — Data Access
Repositories provide typed methods returning OperationResult.

```python
class ApplicationRepository:
    def find_by_id(self, app_id) -> OperationResult[ApplicationORM]:
        try:
            app = ApplicationORM.query.get(app_id)
            if not app:
                return OperationResult.error(ErrorCode.NOT_FOUND, "Application not found")
            return OperationResult.ok(data=app)
        except Exception as e:
            return OperationResult.error(ErrorCode.DB_ERROR, str(e))
```

**Repository Rules**:
- ✅ ALL methods return OperationResult[T]
- ✅ Typed return: result.data is ApplicationORM/ApplicationDocumentORM/list, never None for success
- ✅ Use specific ErrorCodes for each failure mode
- ✅ Only place where db.session is used directly

#### `ApplicationRepository.flush()`

Call `app_repo.flush()` between staged DELETEs and staged INSERTs on the same unique key. SQLAlchemy's unit-of-work does not guarantee DELETE-before-INSERT order within a single flush/commit, so failing to flush first causes UNIQUE constraint violations.

The canonical case is resubmission: old `ApplicationDocumentORM` rows are deleted then new ones with the same `(application_id, document_slot)` are inserted. Without the intermediate flush the DB sees both the old and new rows simultaneously.

```python
# Correct resubmit pattern in applicant.py:
for old_doc in old_docs:
    app_repo.delete_document(old_doc)

flush_result = app_repo.flush()   # sends DELETEs to DB before INSERTs
if not flush_result.success:
    app_repo.rollback()
    return flush_result

docs = self.save_documents(...)
app_repo.add_documents(docs)
app_repo.commit()
```

### Layer 5: `models/` — Data Shape (No Logic)
SQLAlchemy ORM models define columns, relationships, and basic serialization. NO business logic. See **ORM Model Naming Convention** above.

---

## Auto-fingerprint on ApplicationORM

`ApplicationORM` has two audit columns:

```python
last_edited_by_id = db.Column(db.Integer, nullable=True)
last_edited_at    = db.Column(db.DateTime, nullable=True)
```

These are set **automatically** by a SQLAlchemy `before_flush` event listener registered in `app/__init__.py`. It fires before every commit and sets both fields from `flask.session["user_id"]` for any dirty or new `ApplicationORM` in the session.

**Rule**: Never manually set `last_edited_by_id` or `last_edited_at` in business code. The listener handles it. If you find manual assignments to these fields, remove them.

---

## The OperationResult Contract (CRITICAL)

Every method in services, classes, and repositories returns OperationResult with this contract:

```python
@dataclass
class OperationResult(Generic[T]):
    success: bool          # True if operation succeeded
    data: T | None         # Business object (ApplicationORM, ApplicationDocumentORM, UserORM, list)
    error_code: ErrorCode | None
    error_msg: str         # User-friendly message, always set on error
```

**Contract Rules**:
1. **SUCCESS PATH**: `OperationResult.ok(data=business_object)`
   - `success = True`
   - `data = ApplicationORM | ApplicationDocumentORM | list | UserORM` (NEVER dict with message)
   - Routes display static message, may use result.data for business logic

2. **ERROR PATH**: `OperationResult.error(ErrorCode.SPECIFIC, "user message")`
   - `success = False`
   - `data = None`
   - `error_msg = "User-friendly message"` — already formatted, ready to flash

**Anti-Patterns (Will be caught in code review)**:
```python
# ❌ WRONG: Wrapping data with message dict
return OperationResult.ok(data={"message": "Success", "app": app})

# ❌ WRONG: Routes extracting message from ApplicationORM object
if result.success:
    msg = result.data.get("message")  # ApplicationORM has no .get()!

# ❌ WRONG: isinstance checks in routes
if isinstance(result.data, dict):
    msg = result.data.get("message")
```

**Correct Pattern**:
```python
result = service.operation(args)
if result.success:
    flash("Static message", "success")  # NOT extracted
else:
    flash(result.error_msg, "error")    # Error already formatted
```

---

## Application Status Pipeline

All `ApplicationORM.status` values and their meaning:

| Status | Set by | Meaning |
|--------|--------|---------|
| `submitted` | Applicant (submit / resubmit) | Waiting for OIDB check |
| `forwarded_to_ydyo` | OIDB | OIDB approved; waiting for YDYO check |
| `forwarded_to_dean` | YDYO | YDYO approved; waiting for Dean review |
| `forwarded_to_ygk` | Dean | Dean approved; waiting for YGK intibak |
| `intibak_complete` | YGK | Intibak table finalised; forwarded to OIDB for ranking |
| `returned` | OIDB or Dean | Sent back to applicant for correction |
| `cancelled` | Applicant | Cancelled by applicant |

**Identifying who returned an application** — the `returned` status alone does not say who triggered it. Check the notes fields:
- `oidb_notes` set, `dean_notes` null → returned by OIDB (at step 0)
- `dean_notes` set → returned by Dean (at step 2)

The applicant tracker uses this logic to place the error marker on the correct timeline step.

**Resubmission** — both `returned` and `cancelled` applications can be resubmitted. The `resubmit` method in `Applicant` clears `oidb_notes`, `dean_notes`, `doc_checker_status`, and `doc_checker_errors` before setting status back to `submitted`.

### Applicant tracker steps

Defined in `config.py` as `APPLICATION_TRACKER_STEPS` (maps 1:1 to index in `APPLICATION_STATUS_STEP`):

| Index | Step label | Active when status is |
|-------|-----------|----------------------|
| 0 | OIDB Check | `submitted` |
| 1 | YDYO Check | `forwarded_to_ydyo` |
| 2 | Dean Review | `forwarded_to_dean` |
| 3 | YGK Intibak | `forwarded_to_ygk` |
| 4 | OIDB Ranking | `intibak_complete` |

---

## Applicant Class — Validation Rules (`classes/users/applicant.py`)

### Form validation (`validate_form_data`)

All fields are mandatory: `full_name`, `id_number`, `target_program`, `target_semester`, `current_gpa`, `source_university`, `osym_points`. Both `current_gpa` and `osym_points` feed directly into the ranking score formula — they must be accurate.

- **Turkish National ID** — validated by `validate_turkish_id()` (module-level function in `applicant.py`): must be 11 digits, first digit non-zero, passes the standard checksum algorithm.
- **GPA** — must be a float in [0.00, 4.00].
- **OSYM points** — must be a non-negative float. Default pre-filled value in the UI is 400.

### Document validation (`_validate_required_docs`)

Called before `save_documents` in both `submit` and `resubmit`. All slots in `APPLICATION_DOCUMENT_SLOTS` that do not have `"optional": True` are required. Each required file must:
- Be present (non-empty filename)
- Have a `.pdf` extension
- Not exceed 5 MB (checked via `stream.seek(0, 2)`)

`save_documents` repeats the extension and size checks as a safety net when actually writing to disk.

---

## Admin Role

Admin is a special role for managing the software itself. It is separate from all business roles (applicant, oidb, dean, ygk, ydyo).

**Key properties**:
- Role slug: `"admin"`
- NOT in `ROLE_DEFINITIONS` → does not appear on the public portal page or staff role selector
- Login at `/auth/admin/login` (navigate directly; not linked from the main portal)
- No self-registration; create accounts via `flask init-admin` or the Flask shell

**Admin class** (`classes/users/admin.py`):
- `list_users()` → all users, ordered by role then email
- `change_user_role(user_id, new_role)` → only assignable (non-admin) roles allowed
- `get_config_summary()` → current feature flag dict from `config.py`
- `get_all_applications()` → all applications for DB overview
- `trigger_backup()` → timestamped SQLite backup in `instance/backups/`
- `list_backups()` → backup metadata list, newest first
- `restore_backup(filename)` → replaces live DB; disposes engine before swapping the file

**Admin blueprint** (`routes/admin.py`, prefix `/api/admin/`):
- `POST /users/change-role` — change a user's role
- `POST /backup` — create a new backup
- `POST /restore` — restore from a named backup (filename validated, no path traversal)

**Dashboard**: Admin goes to the same `/dashboard/` as other roles, with admin-specific tabs defined in `PHASE1_TABS["admin"]`.

---

## How the Dashboard Tab System Works

Tabs use **lazy loading**: the dashboard shell renders immediately with empty panels. When a user clicks a tab button, JavaScript fetches `/dashboard/tab/<slug>?page=N` which returns the panel HTML fragment. This keeps the initial page load fast regardless of how many applications are in the database.

### URL structure

- `/dashboard/` — the shell (no DB queries)
- `/dashboard/?tab=check-documents` — shell opens on the Check Documents tab automatically
- `/dashboard/?tab=check-documents&page=2` — opens tab on page 2 (survives refresh)
- `/dashboard/tab/check-documents?page=2` — the fetch endpoint (returns HTML fragment only)

### Tab slugs

Slugs are computed from tab titles by `_slugify()` in `dashboard.py`:
`re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')`

| Role | Tab title | Slug | Panel ID |
|------|-----------|------|----------|
| Applicant | Submit Application | `submit-application` | `panel-1` |
| Applicant | Track Application | `track-application` | `panel-2` |
| OIDB | Check Documents | `check-documents` | `panel-1` |
| OIDB | Create Ranking Table | `create-ranking-table` | `panel-2` |
| Dean | Receive & Forward Applications | `receive-forward-applications` | `panel-1` |
| YDYO | Set Prep School Status | `set-prep-school-status` | `panel-1` |
| YGK | Check Applicants | `check-applicants` | `panel-1` |
| YGK | Intibak Table | `intibak-table` | `panel-2` |

Panel IDs are assigned by `loop.index` in `dashboard.html` — they depend on tab order in `PHASE1_TABS`. Tab-jump buttons inside lazy-loaded partials must use the correct `data-target` panel ID. **Submit Application is `panel-1` for applicants** (it is listed first in `PHASE1_TABS["applicant"]`).

### Adding a new tab — four touches

1. **`config.py` → `PHASE1_TABS`** — add entry with `"title"` and `"partial"` keys.

2. **`templates/partials/panel_<role>_<tab>.html`** — create the panel partial. Add a `{% if pagination … %}` block at the bottom if it shows a list.

3. **`routes/dashboard.py` → `_get_tab_data()`** — add a branch for `(role_slug, tab_slug)` that returns the template context dict. Use `_build_pagination()` and Python-slice the list if pagination is needed. Pass `status_counts` if the partial uses stat chips.

4. **Action routes** that POST and redirect: use `url_for("dashboard.index", tab="<slug>")` so the user lands back on the correct tab after an action.

`dashboard.html` holds the `#dashboard-confirm-modal` div (at the top of `{% block content %}`, before `.window-shell`) and otherwise does not need to change for new tabs.

### Error handling

- **Fetch errors** (network down, HTTP 4xx/5xx): `dashboard.js` calls `showToast()` which creates a dismissible toast using the same `.flash-msg` CSS classes as server-rendered flash messages. Toasts auto-dismiss after 5 seconds.
- **Server-rendered flash messages** (after form actions): rendered by `base.html`, auto-dismissed after 4 seconds by the same JS.

### Pagination, filtering, sorting, and search

`_get_tab_data()` uses `_PER_PAGE = 10`. For each paginated staff panel it:

1. Fetches all records from the role class.
2. Computes `status_counts` on the **full** list — chip totals always reflect the complete dataset.
3. Calls `_filter_apps(apps, filter_status)` — supports a single status string **or** comma-separated values.
4. Calls `_search_apps(apps, search)` — case-insensitive substring filter on `full_name`.
5. Calls `_sort_apps(apps, sort_col, sort_dir, col_map)` — numeric-aware sort using a `(bucket, numeric, string)` tuple key so integer IDs sort correctly as numbers, not strings.
6. Slices for the requested page.

Filter, sort, and search travel as query params: `?filter=submitted&sort_col=1&sort_dir=asc&search=ali`. The JS sends these on every chip click, column-header click, or search input (300 ms debounce), so all three apply to the **full dataset** before pagination.

**OIDB-specific sort and visibility**: The OIDB tab filters the full application list to `_OIDB_VISIBLE_STATUSES = {"submitted", "forwarded_to_ydyo", "returned", "cancelled"}` before any chip/sort/search — statuses beyond OIDB's scope (`forwarded_to_dean`, `forwarded_to_ygk`, etc.) are never shown. When no explicit column sort is active, `_oidb_sort_priority(app)` is used instead of `_sort_apps`:

| Priority | Condition |
|---|---|
| 0 | `submitted` + `dean_notes` set ("returned by dean to OIDB") |
| 1 | `submitted` (no dean_notes) |
| 2 | `forwarded_to_ydyo` |
| 3 | `returned` (OIDB returned to applicant) |
| 4 | `cancelled` |

**Panel state element**: Every paginated staff panel partial embeds a hidden `<div class="panel-tab-state" data-filter="…" data-sort-col="…" data-sort-dir="…" data-search="…">` at the top. `dashboard.js` reads this after each fetch to carry all state into the next interaction. Panels without this element (e.g. admin tables) fall back to old client-side filter/sort.

**Active chip highlighting**: The server renders the active chip with `chip-active` class and re-renders the sort indicator span on the active column header — no JS is needed to restore visual state after a re-fetch.

Partials receive: `pagination` dict, `status_counts` dict, `active_filter` str, `active_sort_col` int|None, `active_sort_dir` str, `search_query` str.

**Admin and ROLE_DEFINITIONS**: Admin tabs live in `PHASE1_TABS["admin"]` but `ROLE_DEFINITIONS` does NOT include admin. This means admin's display name won't resolve through the normal lookup — `dashboard.py` handles this with a local `_ROLE_DISPLAY` dict that adds `"admin": "Administrator"`.

---

## Config as the Single Source of Truth

`config.py` owns three categories of constants:

**Tab definitions** (`PHASE1_TABS`) — tabs per role, including `"admin"`. `"partial": None` entries fall back to "coming soon" text.

**Reference data** — lists that populate dropdowns. Programs are defined in `programs.py` and imported; everything else lives directly in `config.py`:
- `PROGRAMS_BY_FACULTY` — dict of `{faculty_name: [program, …]}` used to render `<optgroup>` dropdowns
- `AVAILABLE_PROGRAMS` — flat list derived from `PROGRAMS_BY_FACULTY`, used wherever a simple list suffices
- `AVAILABLE_SEMESTERS` — available intake semesters (currently `2026–2027 / Fall` and `2026–2027 / Spring`)
- `AVAILABLE_FACULTIES` — Faculty of Science, Faculty of Engineering, Faculty of Architecture

**Document slots** (`APPLICATION_DOCUMENT_SLOTS`) — ordered list of `{slot, label}` dicts used by all submit and review screens. All slots are mandatory (no `"optional"` key). The display order does not need to match the slot numbers.

| Display order | Slot | Label |
|---------------|------|-------|
| 1st | 1 | Student Certificate |
| 2nd | 2 | Transcript |
| 3rd | 4 | English Proficiency Certificate |
| 4th | 3 | OSYM Points |
| 5th | 5 | OSYM Certificate |

OSYM Points (slot 3) and OSYM Certificate (slot 5) are listed adjacent so they appear together in the UI. The slot numbers stored in the DB are unchanged; only the display order differs.

`APPLICATION_REQUIRED_DOCUMENT_SLOTS` is derived as `[s["slot"] for s in APPLICATION_DOCUMENT_SLOTS if not s.get("optional")]`.

**Feature flags** — `APPLICATION_SUBMISSION_PERIOD_OPEN`, `APPLICATION_CANCELLATION_ALLOWED`, `APPLICATION_RESUBMISSION_ALLOWED`. Flip these to open/close periods without touching logic.

**Tracker** — `APPLICATION_TRACKER_STEPS` and `APPLICATION_STATUS_STEP` define the applicant-facing pipeline display. See **Application Status Pipeline** section above.

---

## CLI Management Commands

Registered in `app/cli.py` and attached to the Flask app in `create_app()`.

```bash
FLASK_APP=run.py flask init-admin                      # create admin@admin/admin if not exists
FLASK_APP=run.py flask init-admin --email x --password y  # custom credentials
FLASK_APP=run.py flask seed-db                         # wipe + reseed with test data (prompts)
FLASK_APP=run.py flask seed-db --yes                   # skip confirmation (useful in scripts)
```

**`init-admin`** is idempotent — safe to run on every container boot. The Docker `entrypoint.sh` calls it before starting the server so the admin account always exists when the volume is fresh.

**`seed-db`** wipes ALL data and recreates:
- Staff: `admin@admin/admin`, `oidb@test/test`, `dean@test/test`, `ygk@test/test` (`department=computer_engineering`), `ydyo@test/test`
- Applicants `applicant1@test` … `applicant12@test` (password: `test`), covering all workflow statuses and edge cases
- `applicant7@test` has `forwarded_faculty="computer_engineering"` so `ygk@test` can see it
- OSYM points use realistic 100–560 range (average ~400, e.g. 362.50, 418.00, 487.50)

---

## Backup / Restore System

Managed through `SQLAlchemyDatabaseAdapter` (the `ILowLevelDatabase` implementation) and surfaced via the `Admin` class.

- **Backups directory**: `instance/backups/` — timestamped `.bak` files (`project_YYYYMMDD_HHMMSS.bak`)
- **Create**: `Admin.trigger_backup()` → calls `db_interface.backup()`
- **List**: `Admin.list_backups()` → returns `[{filename, created_at, size_kb}]` sorted newest first
- **Restore**: `Admin.restore_backup(filename)` → validates filename (no `/` or `\`, must end `.bak`), calls `db.engine.dispose()` to flush pooled connections, then copies the backup over the live `project.db`

The engine auto-reconnects on the next request after a restore.

---

## Adding a New Column to ApplicationORM

New columns require two changes or existing databases will break on startup:

1. **`models/application.py`** — add the `db.Column(...)` declaration to `ApplicationORM`.
2. **`app/__init__.py` → `_ensure_application_new_columns()`** — add the column name and its SQLite type string to the `additions` dict.

The helper runs `ALTER TABLE application ADD COLUMN …` for any missing column at startup, keeping existing SQLite files compatible.

Columns currently managed by this helper: `id_number`, `target_program`, `target_semester`, `is_currently_enrolled`, `oidb_notes`, `prep_school_status`, `forwarded_faculty`, `last_edited_by_id`, `last_edited_at`, `osym_points`, `doc_checker_status`, `doc_checker_errors`, `dean_notes`.

The same pattern is used for other tables:
- `_ensure_user_department_column()` — adds `department VARCHAR(120)` to `user` table (for YGK routing)
- `_ensure_intibak_estimated_gpa_column()` — adds `ranking_score FLOAT` to `intibak_table` (also adds the legacy `estimated_gpa FLOAT` for backwards compatibility with existing databases)

When adding a new ORM model entirely (e.g. `IntibakTableORM`), `db.create_all()` handles creating it on a fresh database. The `_ensure_*` helpers are only needed for columns added to **existing** tables after the model was first deployed.

`ApplicationORM` also has computed `@property` fields (no column, no migration needed):
- `parsed_checker_errors` — `doc_checker_errors` JSON decoded to a list of dicts, safe for template use
- `doc_checker_sort_key` — int (0=errors, 1=not checked, 2=passed) used as the sort key for the Doc Checker column so it sorts meaningfully rather than alphabetically on the raw string

---

## Status Badge CSS Convention

Status badges use `.status-badge.status-<status>` classes defined in `main.css`. The class name mirrors the `ApplicationORM.status` value exactly (underscores included). All `forwarded_*` statuses are **green** — they represent progression. `submitted` and `returned` are yellow and red respectively.

**Exception — Dean panel only**: `forwarded_to_dean` appears yellow inside the Dean's own panel (because it is *pending* from the dean's perspective). This is achieved with a separate `.status-pending-dean` class applied only in `panel_dean_applications.html`. The global `.status-forwarded_to_dean` rule stays green so other panels (OIDB, YDYO) see the correct colour.

**Secondary badge — "From Dean"**: In the OIDB panel, when an application has `dean_notes` set and its status is `submitted`, a second `.status-from-dean` badge (amber) is rendered next to the main status badge. This indicates the application was returned from the dean and needs re-review by OIDB. The `dean_notes` value itself is shown in the expand row. This is purely a display hint — it does not represent a separate DB status value.

**Rule**: Never change a global `.status-*` rule to solve a role-specific display need. Add a role-specific override class instead.

---

## Role Implementation Checklist

| Role | Class file | Route file | Dashboard partial | `_get_tab_data` branch |
|------|-----------|-----------|-------------------|------------------------|
| Admin | `classes/users/admin.py` | `routes/admin.py` | `panel_admin_*.html` (3 tabs) | ✓ |
| Applicant | `classes/users/applicant.py` | `routes/applicant.py` | `panel_applicant_*.html` | ✓ |
| OIDB | `classes/users/oidb.py` | `routes/oidb.py` | `panel_oidb_documents.html`, `panel_oidb_ranking.html` | ✓ |
| Dean | `classes/users/dean.py` | `routes/dean.py` | `panel_dean_applications.html` | ✓ |
| YDYO | `classes/users/ydyo.py` | `routes/ydyo.py` | `panel_ydyo_documents.html` | ✓ |
| YGK | `classes/users/ygk.py` | `routes/ygk.py` | `panel_ygk_applicants.html`, `panel_ygk_intibak.html` | ✓ |

### YGK role — full implementation

**Department routing**: YGK users are differentiated by `UserORM.department` (VARCHAR, nullable). On login, `department` is stored in `session["user_department"]`. The `get_pending_applicants()` method filters applications by `forwarded_faculty == user_department`. When a Dean forwards to YGK, the department key is auto-derived from the application's `target_program` via `get_department_for_program()` in the `curricula` package (e.g. `"Computer Engineering"` → `"computer_engineering"`).

**Dashboard title** — when `role_slug == "ygk"`, `dashboard.py` builds `role_name` as `"YGK – <Department Name> Department"` from the session's `user_department` key (converted with `.replace('_', ' ').title()`).

**Intibak table data model**:

| ORM | Table | Key columns |
|-----|-------|-------------|
| `IntibakTableORM` | `intibak_table` | `application_id` (unique FK), `ranking_score` (Float) |
| `IntibakCourseORM` | `intibak_course` | `intibak_table_id`, `side` ("left"/"right"/"taken"), `course_name`, `course_code`, `credits`, `akts`, `grade`, `position` |

`estimated_gpa` column exists in older databases but is no longer written or read. Do not use it.

`IntibakTableORM` has a `unique=True` FK to `application` — one intibak table per application, auto-created on first access by `IntibakRepository.get_or_create_table()`.

**Grade scale** — 9 grades used across all intibak selects and AKTS-weighted calculations:

| Grade | Points |
|-------|--------|
| AA | 4.00 |
| AB | 3.50 |
| BB | 3.00 |
| BC | 2.50 |
| CC | 2.00 |
| CD | 1.50 |
| DD | 1.00 |
| DF | 0.50 |
| FF | 0.00 |

`_VALID_GRADES` in `IntibakRepository` enforces this set server-side.

**Ranking score formula** (server: `routes/ygk._calc_ranking_score(app_obj)`):
```
ranking_score = (osym / 560) × 90  +  (current_gpa / 4.0) × 10
```
Result range: 0–100. Uses the applicant's submitted `osym_points` (90 % weight) and submitted `current_gpa` (10 % weight). Returns `None` when either field is absent. The ranking score is computed at "Send to OIDB" time and stored in `IntibakTableORM.ranking_score`. The intibak template shows the pre-computed score from the server — there is no live JS recalculation.

**YGK class methods** (`classes/users/ygk.py`):

| Method | Purpose |
|--------|---------|
| `get_pending_applicants()` | `forwarded_to_ygk` + `intibak_complete` apps filtered by session department |
| `get_intibak_table(app_id)` | Get-or-create `IntibakTableORM` |
| `add_course(app_id, side, data)` | Add a course row (side: "left"/"right"/"taken") |
| `delete_course(course_id)` | Delete a course row |
| `update_course_grade(course_id, grade)` | Update grade on one row |
| `approve_for_oidb(app_id, ranking_score)` | Save ranking score + set status `intibak_complete` |
| `get_document(doc_id)` | Fetch a document ORM (for transcript viewing) |

**YGK routes** (`routes/ygk.py`, prefix `/api/ygk/`):

| Route | Method | Purpose |
|-------|--------|---------|
| `/intibak/<app_id>/add-course` | POST | Add course row; returns `{success, course}` |
| `/intibak/course/<course_id>` | DELETE | Remove course row |
| `/intibak/course/<course_id>` | PATCH | Update grade; returns `{success, course}` |
| `/intibak/<app_id>/send-to-oidb` | POST | Compute ranking from `current_gpa`+`osym_points`, save it, set status `intibak_complete` |
| `/intibak/<app_id>/export-json` | GET | Download intibak table as JSON via `IntibakExporter` |
| `/view-document/<doc_id>` | GET | Serve transcript PDF |

**`IntibakExporter`** (`classes/intibak_exporter.py`):
- `to_dict()` — canonical export: `export_version`, `exported_at`, `application` info, `applicant_courses`, `equivalent_courses`, `courses_to_take` (no grade in `courses_to_take`)
- `to_json(indent=2)` — JSON string from `to_dict()`
- Future `to_pdf()` can use the same `to_dict()` as input

**Curricula package** (`curricula/`):
- `CURRICULA` dict keyed by department string (e.g. `"computer_engineering"`)
- `PROGRAM_DEPARTMENT_MAP` maps `target_program` string → department key
- `get_department_for_program(target_program)` — used by Dean for auto-routing
- `get_curriculum(department)` — used by dashboard `intibak-table` branch
- Add new departments by creating a new module and registering it in `CURRICULA` + `PROGRAM_DEPARTMENT_MAP`

**Intibak Table UI** (`templates/partials/panel_ygk_intibak.html`):
- Three tables: Left (applicant's courses, manual entry), Right (equivalent courses from curriculum), Taken (courses to be taken from curriculum — no grade column)
- **Connect Rows** button: multi-select left rows (toggle), single-select right row, confirm → AKTS-weighted grade computed from left rows and written to right row via PATCH
- **Ranking Score bar**: static display of the pre-computed score (from `current_gpa` + `osym_points`), injected server-side as `ranking_score`. There is no live GPA recalculation — estimated GPA has been removed.
- **Export to JSON | Send to OIDB** buttons at the bottom (Save button has been removed — courses auto-save on every grade change)
- Send to OIDB: computes ranking from `current_gpa`/`osym_points` on server, saves to `IntibakTableORM.ranking_score`, changes status to `intibak_complete`, then calls `window.dashboardForceRefresh('panel-1', 'check-applicants')` to force-reload the applicant list
- Applicants with `intibak_complete` status show "Intibak Complete ✓" (non-clickable) instead of the "Open Intibak Table" button

**Inline `<script>` execution**: Tab content is loaded via `innerHTML`. Browsers do not execute `<script>` tags inserted that way. `fetchTabContent` in `dashboard.js` re-executes them by replacing each `<script>` element with a newly created one (standard workaround).

**`window.dashboardForceRefresh(panelId, slug)`**: exposed from within the `DOMContentLoaded` closure in `dashboard.js`. Clears `loaded[panelId]` then calls `activatePanel(panelId, slug)` — use this from inline panel scripts to force a re-fetch after a state-changing action.

### OIDB class methods (`classes/users/oidb.py`)

| Method | Purpose |
|---|---|
| `get_pending_applicants()` | All applications (filtered to OIDB-visible statuses in `_get_tab_data`) |
| `forward_to_ydyo(id)` | Forward a single application to YDYO |
| `cancel_forward_to_ydyo(id)` | Revert a `forwarded_to_ydyo` app back to `submitted` |
| `return_application(id, notes)` | Return to applicant with required reason notes |
| `run_doc_checker_all()` | Run doc checker on all `submitted` apps, store results, **do not forward** |
| `auto_forward_checked()` | Forward all `submitted` apps that already passed the checker — **does not re-run checker** |
| `auto_check_and_forward_all()` | Legacy combined: run checker + forward passers in one step |

### OIDB — Create Ranking Table tab

`panel_oidb_ranking.html` — shows all `intibak_complete` applications sorted by `ranking_score` DESC. A program dropdown lets OIDB filter by `target_program`. Selecting a program re-fetches the partial with `?program=<name>`. The filter dropdown and table headers are always rendered — an empty filtered result shows a message only in `<tbody>`, never collapses the whole UI.

Data flow: `_get_tab_data("oidb", "create-ranking-table")` calls `ApplicationRepository.get_intibak_complete_apps()` (eagerly loads `intibak_table`), sorts by `ranking_score` DESC, filters by `program` query param if provided.

### OIDB routes (`routes/oidb.py`, prefix `/api/oidb/`)

| Route | Method |
|---|---|
| `POST /run-doc-checker` | Calls `run_doc_checker_all()` |
| `POST /auto-forward-checked` | Calls `auto_forward_checked()` |
| `POST /forward-to-ydyo/<id>` | Single-app forward |
| `POST /cancel-forward-to-ydyo/<id>` | Cancel forward |
| `POST /return-application/<id>` | Return to applicant |
| `GET /view-document/<doc_id>` | Serve document PDF |
| `GET /create-ranking-table` | 204 stub; ranking data served via `_get_tab_data` |

---

## Dashboard Animations (`static/css/dashboard.css`)

Three keyframes are defined at the top of `dashboard.css`:

| Keyframe | Used on | Purpose |
|---|---|---|
| `fadeSlideIn` | `.workspace-panel.active`, `.tab-content-wrap`, `.module-card` | Fade + 6px upward slide on enter |
| `loadingPulse` | `.tab-loading-placeholder` | Opacity pulse while content is fetching |

Animation specifics:
- **Panel switch** — `.workspace-panel.active` plays `fadeSlideIn 0.2s` every time a tab becomes active.
- **Card stagger** — `.cards-grid .module-card` plays `fadeSlideIn 0.25s` with `:nth-child(1–6)` delays (0–0.30s, step 0.06s).
- **Card hover** — `.module-card` has `transition: box-shadow, transform` and lifts 2px on hover.
- **Lazy content** — fetched tab HTML is wrapped in `<div class="tab-content-wrap">` so every load replays `fadeSlideIn 0.22s`.
- **Re-fetch dim** — `.panel-fetching` sets `opacity: 0.4; pointer-events: none` while a filter/sort/page fetch is in flight; the class is added/removed by `fetchTabContent` in JS.

---

## Dashboard JavaScript (`static/js/dashboard.js`)

All interactive behavior for the dashboard lives here:
- **Tab switching** — `.tab-button` clicks toggle `.workspace-panel.active`
- **Chip filters** — any `.stats-row[data-filter-table="<id>"]` auto-wires its `[data-filter]` chips to filter the named table by `data-status` on header rows
- **Column sort** — any `<table id="...">` with `<th data-sort="N">` gets clickable sort (row-pairs kept together during sort so expand rows stay linked)
- **Expand rows** — `.expand-btn` opens/closes `.app-row-expand` with animated slide; only one open at a time
- **Confirm modal** — any button with `data-modal-trigger` shows `#dashboard-confirm-modal`. The button must also have `data-modal-msg="…"` (message text) and `data-form="<form-id>"` (which form to submit on confirm). Clicking Cancel, Confirm, or the overlay closes it.

### Confirm modal — shared `modalPendingForm` variable

The modal's OK/Cancel/overlay listeners are wired **once** (guarded by `modal._wired`). The form to submit is stored in `modalPendingForm`, declared at the top of the `DOMContentLoaded` scope — **not** inside `afterFetch`. This is load-order-safe: whichever panel is fetched first wires the listeners, but every subsequent panel's trigger buttons all write to the same shared variable that those listeners read.

**Anti-pattern that breaks modals**: declaring `let pendingForm` inside `afterFetch`. Each panel load creates its own copy; the once-wired OK listener captures only the first copy and never sees updates from later panels.

### Multi-step application form (`initAppForm`)

`validateStep(n)` validates the current step before advancing:
- All `[required]` inputs/selects must be non-empty. File inputs are handled separately — empty file or wrong type shows a red outline on the `doc-upload-label` wrapper.
- **Turkish ID** (`input[name="id_number"]`) — `validateTurkishId()` runs the 11-digit checksum. Invalid IDs highlight the field red and block progression.
- **GPA** — must be a float in [0, 4.0].
- **OSYM points** — must be a non-negative float.
- **Document files** — must be present, `.pdf` extension, and ≤ 5 MB. Wrong format/size shows an `alert()` in addition to the red outline.

`populateReview()` fills the step-4 review panel including `rv-osym` (OSYM Points).

### Re-fetch (filter / sort / page)

`fetchTabContent` checks for `.tab-content-wrap` inside the panel to distinguish first load from re-fetch:
- **First load** — replaces panel innerHTML with the loading placeholder.
- **Re-fetch** — adds `.panel-fetching` (dims existing content) instead of wiping it. Removes the class and swaps innerHTML when the response arrives. This prevents the "white flash" that would occur if the DOM were cleared before the fetch completed.

### Expand / collapse animation

`expandRow(row)` and `collapseRow(row)` drive the animation. Key design decisions:

- **Wrapper div** — on first call, `getExpandWrap(content)` inserts `<div class="expand-anim-wrap" style="overflow:hidden">` around `.expand-content` inside the `<td>`. We animate `max-height` on this wrapper (which has no padding or border of its own) rather than on `.expand-content` directly. This guarantees `max-height: 0` means true 0 height — animating the inner div would leave residual height from its `padding: 16px`.
- **Forced reflow** — `void wrap.offsetHeight` is used (not `requestAnimationFrame`) to commit the initial 0-height state before the transition begins.
- **`offsetHeight` not `scrollHeight`** — `collapseRow` reads `wrap.offsetHeight` (current rendered height) to start from the correct mid-animation position. `scrollHeight` returns 0 when `overflow:hidden; max-height:0` is already set, which would produce a no-op transition and leave the row stuck (never hidden).
- **Immediate bail** — if `wrap.offsetHeight === 0` when `collapseRow` is called (already collapsed), `row.hidden = true` is set immediately with no transition; this prevents a stuck open state when clicking rapidly.
- **`<td>` border** — the `<td>` in `.app-row-expand` has `border-bottom: 1px` in CSS. `collapseRow` zeroes this inline before the animation starts and restores it in the `transitionend` cleanup. Without this, a 1px residual row remained visible until `row.hidden = true` fired, causing a visible jerk.
- **Listener guard** — each wrap stores its active `transitionend` listener as `wrap._anim`. Both functions cancel any in-progress animation (remove old listener, restart) before adding a new one.

---

## Auth Routes

| Endpoint | Who | Notes |
|---|---|---|
| `/auth/applicant/login` | Applicants | No role selector |
| `/auth/applicant/register` | Applicants | Open self-registration |
| `/auth/staff/login` | Staff roles (oidb, dean, ygk, ydyo) | Role dropdown; role validated against `_STAFF_SLUGS` |
| `/auth/staff/register` | Disabled | Redirects to staff login with message; staff accounts created via admin |
| `/auth/admin/login` | Admin only | No role selector, no register link, not linked from main page |

Admin is excluded from `_STAFF_SLUGS` — attempting to log in as admin via the staff login route returns "Invalid role selected."

---

## Standalone Pages vs. Dashboard

Routes like `/api/oidb/check-documents` and `/api/dean/check-applicants` render standalone templates. These exist for direct URL access but are **not** the primary UI — the dashboard is.

---

## How a Request Flows

```
Browser
  → route function (routes/<role>.py)
      → _svc() instantiates role class (classes/users/<role>.py)
          → class method queries/updates via ApplicationRepository / UserRepository
      → flash message + redirect  OR  render_template
          → dashboard.html shell
              → {% include tab.partial %} (templates/partials/)
```
