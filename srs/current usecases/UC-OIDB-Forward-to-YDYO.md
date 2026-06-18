# UC: OIDB Forwards Application to YDYO

**Actor:** OIDB Staff  
**Priority:** High  
**Metadata:** Created 2026-06-06

---

## Use Case Description

OIDB staff opens an individual applicant's details and documents, reviews them, and approves the application by forwarding it to the YDYO office.

---

## Preconditions

- PRE-1. OIDB staff is logged into the system.
- PRE-2. At least one application with "Submitted" status is visible in the Check Documents tab.

---

## Postconditions

- POST-1. The application's status changes to "Forwarded To Ydyo".
- POST-2. The application becomes visible to YDYO staff in their Set Prep School Status tab.
- POST-3. The dashboard returns to the Check Documents tab with a success message.

---

## Normal Course of Events

1. OIDB navigates to the **Check Documents** tab from the dashboard.
2. The tab loads a table listing all applications visible to OIDB, with chip counts at the top showing Total, Submitted, Forwarded, and Returned totals.
3. OIDB finds an application with "Submitted" status and clicks its **Expand** button.
4. The row expands below, showing:
   - A Document Checker status banner.
   - Applicant details (name, program, semester, email, ID number, GPA, OSYM points, university, enrollment status).
   - A document list with a **View** button for each of the five slots (Student Certificate, Transcript, English Proficiency Certificate, OSYM Points, OSYM Certificate).
   - Action buttons: **Approve & Forward to YDYO** and **Return to Applicant**.
5. OIDB optionally clicks **View** on any document to open the PDF in a new browser tab.
6. OIDB clicks **Approve & Forward to YDYO**.
7. The page reloads on the Check Documents tab.
8. A success message "Application forwarded to YDYO successfully." appears at the top of the page.
9. The application's status badge now shows "Forwarded To Ydyo".
10. Expanding that application again shows only a **Cancel Forward to YDYO** button — the forward and return buttons are gone.

---

## Alternative Courses

**3.AC.1 — No submitted applications are present**  
The table shows "No applications match this filter." OIDB cannot take any action.

**4.AC.1 — Application was previously returned by the Dean**  
An amber "From Dean" badge appears next to the status badge. Inside the expanded row an info-box shows the Dean's return note. OIDB can still forward the application normally from step 6.

**4.AC.2 — Application has doc checker errors**  
A red "Errors Found" banner lists the issues. OIDB can still click **Approve & Forward to YDYO** — the doc checker result is advisory and does not block manual forwarding.

**6.AC.1 — OIDB accidentally forwarded the wrong application**  
OIDB expands the row and clicks **Cancel Forward to YDYO**. A confirmation dialog appears. OIDB confirms, and the application reverts to "Submitted" status. The forward and return buttons reappear.

---

## Exceptions

- **EXC-1.** The system is unreachable (network error). The page fails to load; no status change occurs.

---

## Special Requirements

- SR-1. The **Return to Applicant** button is disabled until OIDB types a reason in the text field below it.
- SR-2. Document PDFs open in a new tab so OIDB does not lose the expand state.
- SR-3. Only one application row can be expanded at a time; opening a new row collapses the previous one.

---

## Assumptions

- No email or notification is sent to the applicant or YDYO when the status changes.

---
---

# Test Cases: OIDB Forwards Application to YDYO

---

## TC-FWD-01 — Forward a submitted application (happy path)

**Priority:** High  
**Preconditions:** OIDB staff is logged in. At least one application with "Submitted" status exists.

**Steps:**
1. Click the **Check Documents** tab.
2. Locate a row showing the "Submitted" status badge.
3. Click **Expand** on that row.
4. Click **Approve & Forward to YDYO**.

**Expected Result:**
- The page reloads on the Check Documents tab.
- A green success message "Application forwarded to YDYO successfully." is shown.
- The application's status badge reads "Forwarded To Ydyo".
- Expanding the same row shows only the **Cancel Forward to YDYO** button; the approve and return buttons are no longer visible.

---

## TC-FWD-02 — Expand row shows correct content before forwarding

**Priority:** High  
**Preconditions:** OIDB staff is logged in. A submitted application exists with all five documents uploaded and a "Checked OK" doc checker result.

**Steps:**
1. Open the Check Documents tab.
2. Click **Expand** on a submitted application.

**Expected Result:**
- A "Checked OK" badge appears in the Doc Checker column of that row.
- No error banner is shown inside the expanded area.
- All five document slots are listed, each with a **View** button.
- Applicant details (name, GPA, ID number, etc.) are visible.
- **Approve & Forward to YDYO** button is present and clickable.
- **Return to Applicant** button is present but greyed out (disabled).

---

## TC-FWD-03 — Return to Applicant button requires a reason before it activates

**Priority:** Medium  
**Preconditions:** OIDB staff is logged in. A submitted application row is expanded.

**Steps:**
1. Observe the **Return to Applicant** button — it is disabled.
2. Click inside the reason textarea below the button without typing anything.
3. Type at least one character into the textarea.

**Expected Result:**
- After step 2: button remains disabled.
- After step 3: button becomes enabled (clickable).

---

## TC-FWD-04 — Application with doc checker errors can still be forwarded

**Priority:** Medium  
**Preconditions:** OIDB staff is logged in. A submitted application exists with doc checker errors (status shows "Errors Found").

**Steps:**
1. Open Check Documents tab.
2. Click **Expand** on the application showing "Errors Found".
3. Observe the red error banner listing the issues.
4. Click **Approve & Forward to YDYO**.

**Expected Result:**
- The forward succeeds as in TC-FWD-01.
- The error banner was advisory; it did not block the action.

---

## TC-FWD-05 — Application returned by Dean shows context and can be forwarded

**Priority:** Medium  
**Preconditions:** OIDB staff is logged in. An application exists with "Submitted" status and a Dean return note attached (shown with an amber "From Dean" badge).

**Steps:**
1. Open Check Documents tab.
2. Locate the row with both "Submitted" and "From Dean" badges.
3. Click **Expand**.
4. Read the "Returned by Dean" info-box showing the Dean's note.
5. Click **Approve & Forward to YDYO**.

**Expected Result:**
- The Dean's note is visible in the expanded row before forwarding.
- The forward succeeds as in TC-FWD-01.

---

## TC-FWD-06 — Already-forwarded application shows only Cancel button (no forward button)

**Priority:** High  
**Preconditions:** OIDB staff is logged in. An application exists with "Forwarded To Ydyo" status.

**Steps:**
1. Open Check Documents tab.
2. Click **Expand** on the application showing "Forwarded To Ydyo".

**Expected Result:**
- Only the **Cancel Forward to YDYO** button is shown in the action area.
- The **Approve & Forward to YDYO** and **Return to Applicant** buttons are not present.

---

## TC-FWD-07 — Cancel Forward to YDYO reverts the application

**Priority:** Medium  
**Preconditions:** OIDB staff is logged in. An application has "Forwarded To Ydyo" status and YDYO has not yet acted on it.

**Steps:**
1. Open Check Documents tab.
2. Click **Expand** on the forwarded application.
3. Click **Cancel Forward to YDYO**.
4. A confirmation dialog appears: "Cancel the forward to YDYO? The application will revert to Submitted status."
5. Click **Confirm**.

**Expected Result:**
- The dialog closes.
- The page reloads on the Check Documents tab with a success message "Forward to YDYO cancelled. Application reverted to submitted status."
- The application's status badge now shows "Submitted".
- Expanding the row again shows **Approve & Forward to YDYO** and **Return to Applicant** buttons.

---

## TC-FWD-08 — Cancel dialog can be dismissed without making changes

**Priority:** Low  
**Preconditions:** OIDB staff is logged in. An application has "Forwarded To Ydyo" status.

**Steps:**
1. Expand the forwarded application row.
2. Click **Cancel Forward to YDYO**.
3. The confirmation dialog appears.
4. Click **Cancel** (or click outside the dialog).

**Expected Result:**
- The dialog closes.
- The application status remains "Forwarded To Ydyo".
- No page reload occurs.

---

## TC-FWD-09 — Viewing a document opens a new tab without closing the expanded row

**Priority:** Low  
**Preconditions:** OIDB staff is logged in. A submitted application with at least one uploaded document is expanded.

**Steps:**
1. Click the **View** button next to any document slot.

**Expected Result:**
- A new browser tab opens and displays the PDF.
- The original tab remains on the dashboard with the expand row still open.

---

## TC-FWD-10 — Only one expand row is open at a time

**Priority:** Low  
**Preconditions:** OIDB staff is logged in. At least two application rows are visible.

**Steps:**
1. Click **Expand** on row A.
2. Click **Expand** on row B.

**Expected Result:**
- Row A collapses (with animation) when row B opens.
- Only row B's details are visible.

---

## TC-FWD-11 — Staff not signed in cannot access the Check Documents tab

**Priority:** High  
**Preconditions:** Staff member is not logged in (no active session).

**Steps:**
1. Attempt to navigate directly to the dashboard URL.

**Expected Result:**
- The system redirects to the staff login page.
- No application data is shown.
