# UC: YDYO Forwards Application to Dean

**Actor:** YDYO Staff  
**Priority:** High  
**Metadata:** Created 2026-06-06

---

## Use Case Description

YDYO staff opens an individual applicant's details and reviews their English Proficiency document. Based on the review, YDYO marks the applicant's English prep school status — either eligible or needing an internal test — and forwards the application to the Dean's office.

---

## Preconditions

- PRE-1. YDYO staff is logged into the system.
- PRE-2. At least one application forwarded from OIDB is visible in the Set Prep School Status tab.

---

## Postconditions

- POST-1. The application's status changes to "Forwarded To Dean".
- POST-2. The application is marked with the chosen prep school status: either "Eligible" or "Needs Test".
- POST-3. The application becomes visible to the Dean in their Receive & Forward Applications tab.
- POST-4. The dashboard returns to the Set Prep School Status tab with a success message.

---

## Normal Course of Events

1. YDYO navigates to the **Set Prep School Status** tab from the dashboard.
2. The tab loads a table listing all applications forwarded to YDYO. Each row shows the applicant's name, program, semester, whether an English Proficiency document was provided (Provided / Missing badge), the Doc Checker result, and the submission date.
3. YDYO finds an application and clicks its **Expand** button.
4. The row expands, showing:
   - A Document Checker status banner (Needs Manual Check / Checked OK / Errors Found).
   - Applicant details (email, ID number, GPA, OSYM points, university).
   - An English Proficiency Document section with the filename, a checkbox to mark it as verified, and a **View** button.
   - Two action buttons: **English Eligible — Forward to Dean** and **Needs Internal Test — Forward to Dean**.
5. YDYO clicks **View** next to the English Proficiency document to open the PDF in a new tab and review it.
6. YDYO ticks the checkbox on the document to mark it as reviewed (visual confirmation only).
7. YDYO selects the appropriate action:
   - **7a.** If the document satisfies the English proficiency requirement, YDYO clicks **English Eligible — Forward to Dean**.
   - **7b.** If the applicant's English proficiency is insufficient and they must take an internal test, YDYO clicks **Needs Internal Test — Forward to Dean**.
8. The page reloads on the Set Prep School Status tab.
9. A success message "Application marked and forwarded successfully." appears at the top of the page.
10. The forwarded application no longer appears in the YDYO table (it has moved to the Dean's queue).

---

## Alternative Courses

**3.AC.1 — No applications are present**  
The tab shows "No applications forwarded to YDYO yet." YDYO cannot take any action.

**3.AC.2 — Application was previously returned by the Dean**  
Inside the expanded row, a "Returned by Dean" info-box displays the Dean's return note above the action buttons. YDYO reviews the note and can still forward using either button.

**4.AC.1 — English Proficiency document is missing**  
The Eng. Doc column shows a "Missing" badge. Inside the expanded row, the English Proficiency Document section shows "No English proficiency document submitted." YDYO can still choose either action button — the system does not block forwarding when the document is absent.

**4.AC.2 — Application has doc checker errors**  
A red "Errors Found" banner lists the issues inside the expanded row. YDYO can still click either forward button; the doc checker result is advisory.

---

## Exceptions

- **EXC-1.** The system is unreachable (network error). The page fails to load; no status change occurs.

---

## Special Requirements

- SR-1. The two forward buttons always appear together; YDYO must actively choose one. There is no default selection.
- SR-2. The English Proficiency document checkbox is a manual visual aid for YDYO; checking or unchecking it does not affect which prep school status gets saved.
- SR-3. The English Proficiency document opens in a new browser tab so YDYO does not lose the current expand state.
- SR-4. Only one application row can be expanded at a time; opening a new row collapses the previous one.

---

## Assumptions

- No email or notification is sent to the applicant or the Dean when the status changes.
- YDYO does not have the ability to return an application to the applicant or to OIDB; their only actions are the two forward options.

---
---

# Test Cases: YDYO Forwards Application to Dean

---

## TC-YDYO-01 — Forward as English Eligible (happy path)

**Priority:** High  
**Preconditions:** YDYO staff is logged in. At least one application is visible in the Set Prep School Status tab.

**Steps:**
1. Click the **Set Prep School Status** tab.
2. Find any application row and click **Expand**.
3. Click **English Eligible — Forward to Dean**.

**Expected Result:**
- The page reloads on the Set Prep School Status tab.
- A green success message "Application marked and forwarded successfully." is shown.
- The forwarded application is no longer listed in the YDYO table.
- The application is now visible in the Dean's Receive & Forward Applications tab with "Forwarded To Dean" status.

---

## TC-YDYO-02 — Forward as Needs Internal Test (happy path)

**Priority:** High  
**Preconditions:** YDYO staff is logged in. At least one application is visible in the Set Prep School Status tab.

**Steps:**
1. Click the **Set Prep School Status** tab.
2. Find any application row and click **Expand**.
3. Click **Needs Internal Test — Forward to Dean**.

**Expected Result:**
- Same reload and success message as TC-YDYO-01.
- The application is forwarded to the Dean with "Needs Test" prep school status recorded.

---

## TC-YDYO-03 — Expand row shows correct content

**Priority:** High  
**Preconditions:** YDYO staff is logged in. An application exists with an English Proficiency document uploaded and a "Checked OK" doc checker result.

**Steps:**
1. Open the Set Prep School Status tab.
2. Click **Expand** on that application.

**Expected Result:**
- No error banner is shown (doc checker passed).
- English Proficiency Document section shows the filename and a **View** button.
- A checkbox labelled "Mark verified" is present next to the document.
- Applicant details (email, GPA, ID number, OSYM points, university) are visible.
- Both **English Eligible — Forward to Dean** and **Needs Internal Test — Forward to Dean** buttons are present.

---

## TC-YDYO-04 — Expand row shows "Missing" when English doc not uploaded

**Priority:** Medium  
**Preconditions:** YDYO staff is logged in. An application exists with no English Proficiency document uploaded.

**Steps:**
1. Open the Set Prep School Status tab.
2. Observe the row — the Eng. Doc column shows a red "Missing" badge.
3. Click **Expand** on that row.

**Expected Result:**
- The English Proficiency Document section reads "No English proficiency document submitted."
- No **View** button or filename is shown.
- Both forward buttons are still present and clickable.

---

## TC-YDYO-05 — Application with doc checker errors can still be forwarded

**Priority:** Medium  
**Preconditions:** YDYO staff is logged in. An application exists with doc checker errors (column shows "Errors Found").

**Steps:**
1. Open the Set Prep School Status tab.
2. Click **Expand** on the application showing "Errors Found".
3. Observe the red error banner listing the issues.
4. Click **English Eligible — Forward to Dean**.

**Expected Result:**
- The forward succeeds as in TC-YDYO-01.
- The error banner was advisory; it did not block the action.

---

## TC-YDYO-06 — Application returned by Dean shows context and can be forwarded

**Priority:** Medium  
**Preconditions:** YDYO staff is logged in. An application exists that the Dean returned to YDYO, with a Dean return note.

**Steps:**
1. Open the Set Prep School Status tab.
2. Click **Expand** on the application.
3. Observe the "Returned by Dean" info-box and read the Dean's note.
4. Click either forward button.

**Expected Result:**
- The Dean's note is visible before the action is taken.
- The forward succeeds with the same success message.

---

## TC-YDYO-07 — Viewing the English Proficiency document opens a new tab

**Priority:** Low  
**Preconditions:** YDYO staff is logged in. An application with an English Proficiency document is expanded.

**Steps:**
1. Click the **View** button next to the English Proficiency document.

**Expected Result:**
- A new browser tab opens showing the PDF.
- The original tab remains on the dashboard with the expand row still open.

---

## TC-YDYO-08 — Checkbox is a visual aid only

**Priority:** Low  
**Preconditions:** YDYO staff is logged in. An application is expanded.

**Steps:**
1. Check the "Mark verified" checkbox on the English Proficiency document.
2. Click **Needs Internal Test — Forward to Dean**.

**Steps (repeat without checking):**
1. Leave the checkbox unchecked.
2. Click **English Eligible — Forward to Dean**.

**Expected Result:**
- Both forwards succeed regardless of the checkbox state.
- The checkbox has no impact on the outcome.

---

## TC-YDYO-09 — Only one expand row is open at a time

**Priority:** Low  
**Preconditions:** YDYO staff is logged in. At least two application rows are visible.

**Steps:**
1. Click **Expand** on row A.
2. Click **Expand** on row B.

**Expected Result:**
- Row A collapses when row B opens.
- Only row B's details are visible.

---

## TC-YDYO-10 — Staff not signed in cannot access the Set Prep School Status tab

**Priority:** High  
**Preconditions:** Staff member is not logged in (no active session).

**Steps:**
1. Attempt to navigate directly to the dashboard URL.

**Expected Result:**
- The system redirects to the staff login page.
- No application data is shown.
