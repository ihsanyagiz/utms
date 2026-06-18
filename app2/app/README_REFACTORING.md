# Quick Reference: Architecture Issues & Documentation

## 📋 Documentation Files Created (May 22, 2026)

**Main refactoring guide:**
- [AGENTS.md](./AGENTS.md) - Complete 5-phase refactoring roadmap

**Specific layer documentation:**
- [classes/.AGENT.md](./classes/.AGENT.md) - Users.py monolithic, boolean returns
- [routes/.AGENT.md](./routes/.AGENT.md) - Business logic in routes
- [database/.AGENT.md](./database/.AGENT.md) - String-based dispatch, missing repositories
- [models/.AGENT.md](./models/.AGENT.md) - No validation, missing timestamps

**Detailed solutions:**
- [OUTPUT_PROBLEM.md](./OUTPUT_PROBLEM.md) - Complete solution for boolean return problem with examples

---

## 🚨 Critical Issues At A Glance

### Issue #1: Boolean Returns Without Context
**Where**: All business logic classes (classes/users.py)
**What**: Methods return `bool` or `tuple[bool, str]` with no error codes
**Why Bad**: Can't debug failures, can't route to different handlers, can't test specific failure modes
**Fix**: Create `OperationResult` class with `ErrorCode` enum (see OUTPUT_PROBLEM.md)
**Example**:
```python
# WRONG: Silent failure
return False

# RIGHT: Rich error context
return OperationResult.error(ErrorCode.APPLICATION_EXISTS, "You already have an application.")
```

**Timeline**: 2-3 days (Phase 0 in AGENTS.md)

---

### Issue #2: Routes Have Business Logic
**Where**: routes/applicant.py, routes/auth.py, routes/dean.py, etc.
**What**: Routes do form parsing, validation, db calls (should be thin HTTP layer only)
**Why Bad**: Business logic can't be reused from CLI/scheduled tasks, hard to test
**Fix**: Create services layer that routes delegate to
**Example**:
```python
# WRONG: Logic in route
form_data = Applicant.parse_form_data(request.form)  # ← Wrong
valid, msg = Applicant.validate_form_data(form_data)  # ← Wrong
applicant = Applicant(session["user_id"], ...)
success, msg = applicant.submit(form_data, ...)

# RIGHT: Delegate to service
service = get_applicant_service(session["user_id"])
result = service.submit_application(request.form, request.files)
if result.success:
    flash("Success", "success")
    return redirect(url_for("dashboard.index"))
```

**Timeline**: 1-2 weeks (Phase 2 & 4 in AGENTS.md)

---

### Issue #3: Monolithic User Classes
**Where**: classes/users.py (335 lines)
**What**: All 5+ role classes (Applicant, DeanOffice, OIDB, YDYO, YGK) in single file
**Why Bad**: Hard to navigate, maintain, test; should be one class per file
**Fix**: Split into directory
```
classes/
  users/
    __init__.py
    applicant.py      # Applicant role
    dean.py           # DeanOffice
    oidb.py           # OIDB
    ydyo.py           # YDYO
    ygk.py            # YGK
```

**Timeline**: 1 week (Phase 3 in AGENTS.md)

---

### Issue #4: Database Code is Sloppy
**Where**: database/adapters.py
**What**: String-based action dispatch (anti-pattern), no repositories, mixed responsibilities
**Why Bad**: No type safety, scattered query logic, impossible to test
**Fix**: Replace with repository pattern
```python
# WRONG: String-based actions
db_adapter.safe_execute('find_user_by_email_role', {'email': '...', 'role': '...'})

# RIGHT: Type-safe repositories
user_repo.find_by_email_and_role(email, role)
```

**Timeline**: 1-2 weeks (Phase 1 in AGENTS.md)

---

### Issue #5: Interfaces All Over the Place
**Where**: database/interfaces.py AND classes/interfaces.py (duplicate)
**What**: Database contracts in database/, domain contracts in classes/
**Why Bad**: No single source of truth; confusing what goes where
**Fix**: Consolidate all interfaces in one place (database/interfaces.py)

**Timeline**: 3-4 days (part of Phase 1 & 3)

---

## 📊 Refactoring Phases (Required Order)

```
┌─────────────────────────────────────────┐
│ Phase 0: OperationResult Class (2-3 days)     
│ - Create app/core/result.py
│ - Define ErrorCode enum
│ - Implement OperationResult<T>
└──────────────────┬──────────────────────┘
                   │ (FOUNDATION - all phases need this)
┌──────────────────▼──────────────────────┐
│ Phase 1: Database Layer (1-2 weeks)      
│ - Create repositories/ directory
│ - Replace string-based dispatch
│ - Move models to database/
└──────────────────┬──────────────────────┘
                   │ (phases 2,3,4 depend on this)
┌──────────────────▼──────────────────────┐
│ Phase 2: Services Layer (1-2 weeks)      
│ - Create services/ directory
│ - Encapsulate business logic
│ - Dependency injection
└──────────────────┬──────────────────────┘
         ┌─────────┴──────────┬──────────┐
┌────────▼──────┐  ┌─────────▼────┐  ┌──▼──────────┐
│ Phase 3: Refactor │ Phase 4: Refactor│ Phase 5: Refactor
│ Classes (1 week)  │ Routes (1-2 wks) │ Models (1 week)
└────────────────┘  └──────────────┘  └──────────────┘
```

**Key Rule**: Cannot start Phase N until Phase N-1 is complete.

---

## ✅ What Agents Should Know

### DO:
1. **Return OperationResult** from all business methods
   - Must include `error_code` from ErrorCode enum
   - Must include helpful `error_msg`
   - Can include `data` for success case
   
2. **Use Repositories** for all data access
   - No `db.session` calls in classes
   - No `db.session` calls in routes
   - All queries go through typed repository methods

3. **Keep Routes Thin**
   - Extract HTTP inputs (request.form, request.files)
   - Call service method
   - Return HTTP response (redirect, render_template, jsonify)
   - Max ~10 lines per route handler

4. **Follow Dependency Order**
   - Do Phase 0 before anything else
   - Do Phase 1 before Phases 2-5
   - Phase 2 completes before Phases 3-4

5. **Test Each Layer**
   - Repository tests: Query correctness
   - Service tests: Business logic + error handling
   - Route tests: HTTP status codes + redirects

### DO NOT:
1. **Return bare bool/None** - Always use OperationResult
2. **Import db directly in classes** - Use repositories
3. **Call db.session in routes** - Delegate to services
4. **Put business logic in routes** - Use services
5. **Use string-based actions** - Use typed repository methods
6. **Skip phases** - They build on each other
7. **Test with strings** - Assert specific ErrorCode enums
8. **Scatter interfaces** - One place per layer

---

## 🔗 Related Issues

- **Routes have business logic** → See routes/.AGENT.md
- **Users.py is 335 lines** → See classes/.AGENT.md  
- **Boolean returns useless** → See OUTPUT_PROBLEM.md (full solution with examples)
- **Database queries scattered** → See database/.AGENT.md
- **Interfaces everywhere** → See database/.AGENT.md
- **No service layer** → See AGENTS.md Phase 2

---

## 📌 Key Statistics

| Metric | Current | Target |
|--------|---------|--------|
| users.py size | 335 lines | ~60-80 lines per role file |
| Database actions | String dispatch | Type-safe repositories |
| Error handling | bool/None | OperationResult + ErrorCode |
| Route logic | Mixed concerns | Thin HTTP layer |
| Service layer | None | Full orchestration |
| Models validation | None | Decorators + constraints |

---

## 🎯 First Steps for Next Agent

If you're the first to work on refactoring:

1. **Read AGENTS.md** (5 min) - Understand full roadmap
2. **Create app/core/result.py** (30 min) - Phase 0, foundation
3. **Write tests** for OperationResult and ErrorCode (1 hour)
4. **Update classes/users.py** to use OperationResult (2-3 hours)
5. **Update routes** to handle new result format (1-2 hours)
6. **Commit & document** progress

If continuing from previous work:

1. **Check AGENTS.md** for current phase
2. **Read corresponding .AGENT.md** for that layer
3. **Follow dependency order strictly**
4. **Verify tests pass before moving to next phase**
5. **Update this document if you find new issues**

---

## 📞 Quick Answers

**Q: Why is users.py so big?**
A: 5 role classes (Applicant, DeanOffice, OIDB, YDYO, YGK) + form parsing + file I/O all in one file. Should split into directory.

**Q: Why can't we use bool returns?**
A: When `submit()` returns False, debugger doesn't know: Was it "duplicate application"? "Invalid GPA"? "File upload failed"? OperationResult with ErrorCode solves this.

**Q: Where should services go?**
A: Create `app/services/` directory. One service file per domain (applicant_service.py, dean_service.py, etc.).

**Q: What about database adapters?**
A: Replace `execute_query(action_name, payload)` with repositories. One repository per entity (UserRepository, ApplicationRepository, DocumentRepository).

**Q: How do I test this?**
A: Test each layer separately:
- Test repositories return correct query results
- Test services handle all ErrorCode cases
- Test routes return correct HTTP status codes

---

## 🔐 Safety Checks Before Committing

- [ ] All business methods return OperationResult
- [ ] All methods have error_code defined
- [ ] No bare bool/None returns in non-trivial methods
- [ ] Routes have no db.session calls
- [ ] Routes have no complex business logic
- [ ] Repositories are type-safe (no string actions)
- [ ] Tests cover all ErrorCode paths
- [ ] No breaking changes to API contracts
- [ ] Documentation updated (.AGENT.md files)
