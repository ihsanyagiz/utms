# Output Problem: Boolean Returns Without Context

## The Problem

Business logic methods return only `bool` or `tuple[bool, str]`:

```python
# Current pattern throughout codebase
def upload(self, payload: dict[str, Any]) -> bool:
    return bool(payload)  # Returns False with ZERO explanation

def validate(self, document_id: int) -> bool:
    return document_id > 0  # Why false? Not documented.

def update_applicant_status(self, application_id: int, status: str) -> bool:
    if not app:
        return False  # Is it "not found"? Not documented.
    app.status = status
    db.session.commit()
    return True

def submit(self, form_data: dict, ...) -> tuple[bool, str]:
    # ... 50+ lines of logic ...
    except ValueError as exc:
        db.session.rollback()
        return False, str(exc)  # Error message, but no error code/category
    except OSError:
        db.session.rollback()
        return False, "Could not store uploaded files."
    return True, ""
```

## Why This is Bad

### 1. **Impossible to Debug**
```python
success, msg = applicant.submit(form_data, upload_root, files, document_slots)
if not success:
    # Now what? You have a string message but:
    # - No way to programmatically check WHAT failed
    # - No way to log/report failure categories
    # - No way to test "what should happen if X fails"
    flash(msg)  # Hoping message is user-friendly
```

### 2. **Can't Test Failure Scenarios**
```python
def test_submit_with_duplicate_application():
    result = applicant.submit(...)
    assert result[0] == False  # ← Brittle, doesn't verify WHICH failure
    # assert result[1] == "You already have an application."  # ← Checking string is fragile
```

### 3. **Can't Route to Different Handlers**
```python
success, msg = applicant.submit(...)
if not success:
    if "duplicate" in msg:  # ← String parsing? Really?
        flash("You already have an application.")
    elif "PDF" in msg:
        flash("All documents must be PDF files.")
    else:
        flash(msg)  # Generic fallback
```

### 4. **Can't Implement Analytics/Monitoring**
```python
# How do you report failure rates by category without error codes?
# e.g., "50% of failures are VALIDATION_FAILED, 30% are FILE_ERRORS, etc."
# You can't -- you'd have to parse strings.
```

### 5. **Message Coupling to Tests**
```python
# If you change the message:
# "You already have an application." → "Duplicate application found."
# Your tests BREAK because they're checking strings.
```

## The Solution: Rich Result Objects

### Option 1: Simple Result Object (Recommended)

```python
from dataclasses import dataclass
from enum import Enum
from typing import Generic, TypeVar

T = TypeVar('T')

class ErrorCode(Enum):
    """Centralized error codes for all operations."""
    # Validation
    VALIDATION_FAILED = "VALIDATION_FAILED"
    INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT"
    INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION"
    GPA_OUT_OF_RANGE = "GPA_OUT_OF_RANGE"
    
    # Not found
    NOT_FOUND = "NOT_FOUND"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND"
    
    # Conflict
    DUPLICATE = "DUPLICATE"
    USER_EXISTS = "USER_EXISTS"
    APPLICATION_EXISTS = "APPLICATION_EXISTS"
    
    # System
    FILE_NOT_SAVED = "FILE_NOT_SAVED"
    DB_ERROR = "DB_ERROR"

@dataclass
class OperationResult(Generic[T]):
    """Rich result object for all operations."""
    success: bool
    data: T | None = None
    error_code: ErrorCode | None = None
    error_msg: str = ""
    
    @classmethod
    def ok(cls, data: T = None) -> "OperationResult[T]":
        """Create success result."""
        return cls(success=True, data=data)
    
    @classmethod
    def error(cls, code: ErrorCode, msg: str) -> "OperationResult":
        """Create error result."""
        return cls(success=False, error_code=code, error_msg=msg)
    
    def is_success(self) -> bool:
        return self.success
    
    def is_error(self, code: ErrorCode) -> bool:
        return not self.success and self.error_code == code
```

### Using OperationResult

```python
# Define error codes once
class ErrorCode(Enum):
    APPLICATION_EXISTS = "APPLICATION_EXISTS"
    INVALID_GPA = "INVALID_GPA"
    FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED"
    DB_ERROR = "DB_ERROR"

# Now all methods return rich results
def submit(self, form_data: dict, ...) -> OperationResult[Application]:
    # Check for existing application
    if Application.query.filter_by(applicant_id=self.user_id).first():
        return OperationResult.error(
            ErrorCode.APPLICATION_EXISTS,
            "You already have an application."
        )
    
    # Validate form data
    if not 0.0 <= float(form_data["current_gpa"]) <= 4.0:
        return OperationResult.error(
            ErrorCode.INVALID_GPA,
            "GPA must be between 0.0 and 4.0"
        )
    
    # Try to save
    try:
        application = Application(applicant_id=self.user_id, **form_data)
        db.session.add(application)
        db.session.flush()
        
        for doc in self.save_documents(application.id, ...):
            db.session.add(doc)
        db.session.commit()
        
        return OperationResult.ok(data=application)
    except ValueError as exc:
        db.session.rollback()
        return OperationResult.error(
            ErrorCode.INVALID_FILE_FORMAT,
            f"File error: {str(exc)}"
        )
    except OSError:
        db.session.rollback()
        return OperationResult.error(
            ErrorCode.FILE_UPLOAD_FAILED,
            "Could not store uploaded files."
        )
    except Exception as exc:
        db.session.rollback()
        return OperationResult.error(
            ErrorCode.DB_ERROR,
            f"Database error: {str(exc)}"
        )
```

### Using in Routes

```python
@applicant_api_bp.route("/submit-documents", methods=["POST"])
def create_application():
    applicant = Applicant(session["user_id"], session.get("user_email", ""), "applicant")
    result = applicant.submit(form_data, upload_root, request.files, document_slots)
    
    # Clear, explicit handling per error type
    if result.success:
        flash("Application submitted successfully.", "success")
        return redirect(url_for("dashboard.index"))
    
    # Handle specific errors
    if result.is_error(ErrorCode.APPLICATION_EXISTS):
        flash("You already have an application. Please resubmit or cancel.", "warning")
    elif result.is_error(ErrorCode.INVALID_GPA):
        flash("GPA must be between 0.0 and 4.0.", "error")
    elif result.is_error(ErrorCode.INVALID_FILE_FORMAT):
        flash("All documents must be PDF files.", "error")
    else:
        flash(result.error_msg, "error")
    
    return redirect(url_for("applicant_api.submit_documents"))
```

### Testing

```python
def test_submit_with_duplicate_application():
    applicant = Applicant(user_id=123, ...)
    # First submission succeeds
    result1 = applicant.submit(form_data, ...)
    assert result1.success
    
    # Second submission fails with specific error code
    result2 = applicant.submit(form_data, ...)
    assert result2.is_error(ErrorCode.APPLICATION_EXISTS)  # ← Clear, semantic check
    assert result2.error_msg == "You already have an application."

def test_submit_with_invalid_gpa():
    form_data = {"current_gpa": "5.5", ...}  # Invalid
    result = applicant.submit(form_data, ...)
    assert result.is_error(ErrorCode.INVALID_GPA)

def test_submit_success():
    result = applicant.submit(form_data, ...)
    assert result.success
    assert result.data.id > 0
```

### Analytics/Logging

```python
result = applicant.submit(form_data, ...)
if not result.success:
    logger.error(
        "Application submission failed",
        extra={
            "error_code": result.error_code.value,
            "user_id": session["user_id"],
            "error_msg": result.error_msg
    )
    # Now you can aggregate failures by error_code in your analytics tool
```

## Implementation Plan

### Step 1: Create result.py
```python
# app/core/result.py (or app/common/result.py)
# Copy the OperationResult and ErrorCode classes above
```

### Step 2: Identify All Error Scenarios
Review every method that returns bool/tuple and list what can fail:
- Validation failures (what specifically can be invalid?)
- Not found errors (which entities?)
- Conflict errors (duplicates, state violations?)
- File errors (format, storage, permissions?)
- Database errors (integrity, connection, etc.)

### Step 3: Define ErrorCode Enum
Create comprehensive enum with all codes from Step 2.

### Step 4: Update Method Signatures
```python
# Before
def submit(self, ...) -> tuple[bool, str]:

# After
def submit(self, ...) -> OperationResult[Application]:
```

### Step 5: Update Method Implementations
Replace `return False, msg` with `OperationResult.error(ErrorCode.XXX, msg)`.

### Step 6: Update Route Handlers
Use `result.is_error(ErrorCode.XXX)` for explicit error handling.

### Step 7: Update Tests
Test that specific error codes are returned for specific failure scenarios.

## Benefits Summary

| Before | After |
|--------|-------|
| `return False` | `return OperationResult.error(ErrorCode.USER_EXISTS, "...")` |
| No way to check error type | `result.is_error(ErrorCode.USER_EXISTS)` |
| String message is only context | Error code + message + data |
| Can't test error scenarios | Can test specific error codes |
| Can't route to different handlers | Can handle each error type differently |
| No analytics per error type | Can aggregate by error_code.value |

## Next Steps

1. Create `app/core/result.py` with OperationResult and ErrorCode
2. Update all business logic methods in classes/ to return OperationResult
3. Update all route handlers to check result.is_error(code)
4. Update tests to assert specific error codes
5. Add analytics/logging that uses error_code for categorization
