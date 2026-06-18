# UTMS Application — Architecture Reference

## Current Architecture (Post-Phase 2)

The refactoring roadmap described in this file's earlier revisions is **complete through Phase 2**. The codebase now follows the clean layered architecture. Do not write code using the old patterns.

```
HTTP Request
    ↓
Routes (thin HTTP layer — routes/)
    ↓
Services (business orchestration — services/)
    ↓
Role Classes (domain logic — classes/users/)
    ↓
Repositories (type-safe data access — database/)
    ↓
ORM Models (data shape — models/)
    ↓
Database (SQLite via SQLAlchemy)
```

## Layer Rules (Summary)

| Layer | Location | Responsibility | Must NOT |
|---|---|---|---|
| Routes | `routes/` | Parse HTTP, call service/class, flash, redirect | Business logic, db access, isinstance checks |
| Services | `services/` | Orchestrate multi-step operations | Accept Flask request object, use db.session |
| Classes | `classes/users/` | Domain rules, state transitions | Import db directly, return bare bool |
| Repositories | `database/` | All db.session usage, typed queries | Be called from routes directly |
| Models | `models/` | Column definitions, relationships | Business logic, state transitions |

For per-layer coding rules see the `.AGENT.md` file in each directory.

## ORM Model Names

All ORM model classes carry the `ORM` suffix and explicit `__tablename__`:

| Class | Table | 
|---|---|
| `UserORM` | `user` |
| `ApplicationORM` | `application` |
| `ApplicationDocumentORM` | `application_document` |

Never use the old bare names (`User`, `Application`, `ApplicationDocument`).

## What Returns What

- **All repository methods** → `OperationResult[ORM model]`
- **All class (role) methods** → `OperationResult[ORM model]`
- **All service methods** → `OperationResult[ORM model]`
- **Routes** → consume OperationResult, flash message, redirect — they return HTTP responses, not OperationResult

## Key Rules for Agents

### ✅ ALWAYS:
- Return `OperationResult` from every service/class/repository method
- Use `ApplicationORM`, `ApplicationDocumentORM`, `UserORM` (ORM-suffixed names)
- Declare `__tablename__` explicitly on any new ORM model
- Use `get_application_repository()` for application data access
- Use `get_user_repository()` for user data access (Admin class only)
- Add new columns to both `models/application.py` AND `_ensure_application_new_columns()` in `__init__.py`

### ❌ NEVER:
- Return bare `bool`, `None`, or `tuple` from business methods
- Call `db.session.*` outside of `database/` layer
- Import `ApplicationORM` / `UserORM` in business classes (use repositories)
- Set `last_edited_by_id` or `last_edited_at` manually (auto-set by `before_flush` listener)
- Add "admin" to `ROLE_DEFINITIONS` (it would appear on the public portal login page)
- Use legacy model names (`User`, `Application`, `ApplicationDocument`)

## Admin Role

Admin is a special role for managing the software. It is NOT in `ROLE_DEFINITIONS`. Login at `/auth/admin/login`. Create the first account with `flask init-admin`. See `codebase_guide.md` for the full admin capability list.

**TODO**: Staff account creation should be possible from the Admin dashboard (User Management tab).
Staff self-registration (`/auth/staff/register`) is intentionally disabled — only admin can provision
new staff accounts. Implement an "Add User" form in `panel_admin_users.html` that POSTs to a new
`POST /api/admin/users/create` route wired to a new `Admin.create_user(email, password, role)` method.

## Auto-fingerprint

Any time an `ApplicationORM` row is committed, `last_edited_by_id` and `last_edited_at` are set automatically by the `before_flush` event listener in `app/__init__.py`. No business code touches these fields.

## CLI Commands

```bash
FLASK_APP=run.py flask init-admin            # idempotent — create admin@admin if absent
FLASK_APP=run.py flask seed-db [--yes]       # wipe + reseed test data
```

## Status Badge CSS Convention

Status badges use `.status-badge.status-<status>` classes. All `forwarded_*` statuses are **green** globally. **Exception**: `.status-pending-dean` (yellow) is used only in `panel_dean_applications.html` for `forwarded_to_dean` entries — pending from the dean's perspective. Never change a global `.status-*` rule for a single-role display need; add a role-specific class instead.

## Ranking Score Formula

```
ranking_score = (osym_points / 560) × 90  +  (current_gpa / 4.0) × 10
```

Computed server-side in `routes/ygk._calc_ranking_score(app_obj)` at "Send to OIDB" time. Uses the applicant's submitted `current_gpa` (real GPA — there is no estimated/intibak GPA). `estimated_gpa` concept has been removed from the system. Returns `None` when either field is absent. Stored in `IntibakTableORM.ranking_score`. The OIDB "Create Ranking Table" tab (`panel_oidb_ranking.html`) reads `IntibakTableORM.ranking_score` and sorts descending.

## Document Slots

`APPLICATION_DOCUMENT_SLOTS` in `config.py` is the single source of truth for upload slots. Current slots: Student Certificate (1), Transcript (2), OSYM Points (3), English Proficiency Certificate (4, optional), OSYM Certificate (5, optional). Optional slots skip the `(optional)` display label but remain non-required on submit. Do not add the `(optional)` text back.

## Dean Document Viewing

Dean can view documents via `GET /api/dean/view-document/<doc_id>` (same pattern as OIDB/YDYO). `DeanOffice.get_document(doc_id)` is the class method. The Dean expanded row shows:
- Doc Checker result banner (errors/passed/not-yet-run) reflecting OIDB's last checker run.
- Per-slot document list with **View** links, using `document_slots` from config.

## Phases Completed

| Phase | What it did |
|---|---|
| 0 | `OperationResult` + `ErrorCode` in `core/` |
| 1 | Repository pattern (`ApplicationRepository`), split `users.py` into `classes/users/` |
| 2 | Service layer (`services/`), OperationResult contract in all routes |
| Infra | ORM renaming, admin role, auto-fingerprint, backup/restore, CLI commands |

Phases 3–5 (other repositories, model validation, route reorganisation) are not yet started.

## Documentation Map

| File | Purpose |
|---|---|
| `ai_spec/codebase_guide.md` | Full architecture, patterns, naming rules |
| `ai_spec/PHASES.md` | Phase history and status |
| `ai_spec/coding_standart.md` | Engineering principles (DRY, SRP, KISS) |
| `ai_spec/design.md` | UI/CSS design system |
| `app/models/.AGENT.md` | ORM model naming and column rules |
| `app/database/.AGENT.md` | Repository method reference and rules |
| `app/classes/.AGENT.md` | Role class rules and patterns |
| `app/routes/.AGENT.md` | Route rules and auth map |
| `app/services/.AGENT.md` | Service layer rules |
