# Refactoring Phases - Central Tracking

**Last Updated**: May 29, 2026  
**Current Phase**: 2 ✅ COMPLETE + Infrastructure additions (see below)

## Phase Overview

This is the SINGLE SOURCE OF TRUTH for refactoring phases. Each directory's `.AGENT.md` contains only coding rules, NOT phase information.

### Phase 0: OperationResult & ErrorCode ✅ COMPLETE
- Created `app/core/result.py` with OperationResult[T] generic and ErrorCode enum
- Updated all methods in auth.py, users.py to return OperationResult
- All files compile without errors

### Phase 1: Repository Pattern & Split Classes ✅ COMPLETE  
- Created `app/database/application_repository.py` with typed methods returning OperationResult
- Split `app/classes/users.py` (335 lines) into `app/classes/users/` directory (6 files)
- All role classes now use ApplicationRepository instead of direct db.session
- Fixed critical architectural issue: database switching now possible without code changes

### Phase 2: Service Layer & OperationResult Contract ✅ COMPLETE (May 23, 2026)

**Goal**: Thin HTTP routes by moving business logic to services and establish consistent OperationResult contract  

**Completed Deliverables**:
- [x] Created `app/services/` directory with BaseService, ApplicationService, AuthService, UserService
- [x] ApplicationService wraps application operations (submit, resubmit, cancel, get)
- [x] AuthService wraps authentication (login, register, password_reset)
- [x] All routes delegate to services instead of direct class calls
- [x] Error handling with OperationResult and error-toasts (red notifications from top)
- [x] **OperationResult Contract Standardized**: Business classes return Application/Document objects in result.data; routes display static success messages (not extracted from data)

**OperationResult Contract (CRITICAL)**:
```python
# All methods follow this pattern:
result = service.operation(args)

# SUCCESS: Business returns Application model in result.data
if result.success:
    # Route displays static message (NOT extracted from data)
    flash("Operation succeeded", "success")
    # Route may use result.data for business logic (e.g., show details)
    detail = result.data  # Application model

# ERROR: Business returns ErrorCode and message in OperationResult
else:
    # Error message is already formatted by business layer
    flash(result.error_msg, "error")  # Toast appears automatically
```

**Key Fix Applied**: Removed ALL isinstance(result.data, dict) workarounds from routes (applicant, dean, oidb, ydyo, ygk). Routes no longer try to extract messages from Application objects — error messages come from result.error_msg.

**Files Updated**:
- ✅ All 5 route files: removed isinstance checks, use static success messages
- ✅ ApplicationService: removed message dict wrapping (violates OperationResult design)
- ✅ All service files compile and Flask app initializes successfully

### Infrastructure Additions (May 29, 2026) ✅ COMPLETE

Completed alongside Phase 2, independent of the phase roadmap:

**ORM Renaming**
- `User` → `UserORM`, `Application` → `ApplicationORM`, `ApplicationDocument` → `ApplicationDocumentORM`
- All three models now have explicit `__tablename__` so SQLite tables are unaffected
- All imports updated across adapters, repository, role classes, and routes

**Audit trail on ApplicationORM**
- Added `last_edited_by_id` (Integer, nullable) and `last_edited_at` (DateTime, nullable)
- Auto-set by a SQLAlchemy `before_flush` event listener in `app/__init__.py` — never set manually
- Both columns added to `_ensure_application_new_columns()` for backward compat with existing DBs

**Admin role**
- New `Admin` class in `classes/users/admin.py`
- New blueprint `routes/admin.py` at prefix `/api/admin/`
- Login at `/auth/admin/login` (not linked from public portal, not in `ROLE_DEFINITIONS`)
- Capabilities: list/change user roles, view config flags, list/create/restore DB backups

**Backup / Restore system**
- Timestamped backups in `instance/backups/` (format: `project_YYYYMMDD_HHMMSS.bak`)
- `Admin.restore_backup(filename)` disposes engine connections before swapping file; filename validated (no path traversal)
- Exposed in the admin Dashboard → Database tab

**CLI management commands** (`app/cli.py`)
- `flask init-admin` — idempotent; creates `admin@admin` account if absent
- `flask seed-db [--yes]` — wipes all data, reseeds with 7 applicants (one per status) + all staff roles
- `entrypoint.sh` calls `init-admin` before starting the server so the admin account survives fresh volumes

**UserRepository additions**
- `list_all_users()` and `update_user_role(user_id, new_role)` added to `SQLAlchemyUserDataService`
- `get_user_repository()` factory exposed from `database/__init__.py`

---

### Phase 3: Refactor Other Classes 🔲 NOT STARTED
**Goal**: Apply repository pattern to other entities (Document, Intibak, etc.)  
**Note**: Skip users.py - already done in Phase 1
**Blocker**: None - Phase 2 is complete, can start anytime

### Phase 4: Refactor Models 🔲 NOT STARTED
**Goal**: Add validation, timestamps, and proper ORM setup  
**Tasks**: Add created_at, updated_at, validators, relationships
**Blocker**: Can start after Phase 3 or independently

### Phase 5: Testing & Integration 🔲 NOT STARTED
**Goal**: Add unit tests, integration tests, and e2e test coverage  
**Dependency**: All business logic phases complete

## Critical Constraints (Phase 2 Complete)

### Database Abstraction (Phase 1+ Requirement)
- ❌ NO direct `db.session` in business classes
- ✅ All data access through repositories (ApplicationRepository, UserRepository)
- ✅ All repository methods return OperationResult with error codes

### Return Types (Phase 0+ Requirement)
- ❌ NO bare `bool`, `tuple[bool, str]`, or `None` returns
- ✅ ALL methods return OperationResult with success/error_code/data/error_msg
- ✅ result.data contains business objects (Application, Document, User), not dict messages

### Error Handling (Phase 2 Requirement)
- ❌ NO silent failures (returning None without explanation)
- ❌ NO isinstance checks in routes — result.data type is guaranteed by OperationResult contract
- ❌ NO message extraction from result.data (e.g., `result.data.get("message")` is WRONG)
- ✅ All errors have specific ErrorCode (not generic DB_ERROR when VALIDATION_FAILED is better)
- ✅ All error messages in result.error_msg — formatted by business layer, displayed as red toast
- ✅ Routes use static success messages (hardcoded in route layer)

### Route Pattern (Phase 2 Requirement)
```python
# CORRECT Pattern - ALL routes follow this:
result = service.operation(args)
if result.success:
    flash("Static message here", "success")  # NOT extracted from result.data
else:
    flash(result.error_msg, "error")  # Error message already formatted

# WRONG Patterns (will be caught in code review):
# ❌ flash(result.data.get("message"), "success")  # Application has no .get()
# ❌ if isinstance(result.data, dict): ...  # Violates contract
# ❌ try: ... except: ...  # Should use OperationResult instead
```

## File Structure After Phase 2

```
app/
  core/                    # ✅ Phase 0
    result.py             
    __init__.py
  database/                # ✅ Phase 1
    application_repository.py
    interfaces.py
    adapters.py
    __init__.py
  classes/                 # ✅ Phase 1
    users/
      applicant.py
      dean.py
      # ... other roles
    auth.py
    interfaces.py
  services/                # 🔄 Phase 2 (NEW)
    __init__.py
    application_service.py
    user_service.py
    # ... other services
  routes/                  # 🔲 Phase 4 (TODO)
    applicant.py
    auth.py
    # ... other routes
  models/                  # 🔲 Phase 5 (TODO)
```

## Dependencies Between Phases

```
Phase 0 (OperationResult)
    ↓
Phase 1 (Repositories, Split Classes)
    ↓
Phase 2 (Services) ← Routes need this before refactoring
    ↓
Phase 4 (Routes refactor) ← Cannot start until Phase 2 done
```

**Implication**: Cannot safely refactor routes (Phase 4) until services (Phase 2) exist.

## When to Update This File

Update PHASES.md when:
- ✅ Completing a phase (mark checkbox, update date)
- ✅ Starting new phase (mark 🔄 IN PROGRESS)
- ✅ Discovering blockers (add to phase description)
- ✅ Major architectural decisions (document here, NOT in .AGENT.md files)

DO NOT update for:
- Small code changes within a phase
- Coding style updates
- File renames
- Minor bug fixes

## Quick Reference

| Phase | Status | Key Requirement | File Location |
|-------|--------|-----------------|---------------|
| 0 | ✅ COMPLETE | OperationResult + ErrorCode | app/core/result.py |
| 1 | ✅ COMPLETE | Repositories + Split classes | app/database/ + app/classes/users/ |
| 2 | ✅ COMPLETE | Services layer | app/services/ |
| Infra | ✅ COMPLETE | ORM rename, admin, fingerprint, CLI, backup | see above |
| 3 | 🔲 TODO | Other repositories | app/database/ |
| 4 | 🔲 TODO | Thin routes | app/routes/ |
| 5 | 🔲 TODO | Validation + timestamps | app/models/ |
