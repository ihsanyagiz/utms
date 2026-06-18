# UC: Dean Forwards Application to YGK

**Actor:** Dean Office Staff  
**Priority:** High  
**Metadata:** Created 2026-06-06

---

## Use Case Description

Dean office staff opens an individual applicant's details and documents, reviews them, and either forwards the application to the YGK department or returns it to a previous stage (applicant, OIDB, or YDYO) with a written reason.

---

## Preconditions

- PRE-1. Dean office staff is logged into the system.
- PRE-2. At least one application with "Pending" status is visible in the Receive & Forward Applications tab.

---

## Postconditions (Forward)

- POST-1. The application's status changes to "Forwarded To Ygk".
- POST-2. The application is automatically routed to the YGK department responsible for the applicant's target program.
- POST-3. The application becomes visible to YGK staff in their Check Applicants tab.
- POST-4. The dashboard returns to the Receive & Forward Applications tab with a success message.
- POST-5. Inside the table, the application row now shows "Forwarded To Ygk" status and the department name instead of action buttons.

## Postconditions (Return)

- POST-1. The application's status reverts to the selected stage.
- POST-2. The Dean's return note is saved and will be visible to whichever office receives the application next.
- POST-3. The dashboard returns to the Receive & Forward Applications tab with a success message.

---

## Normal Course of Events

1. Dean navigates to the **Receive & Forward Applications** tab from the dashboard.
2. The tab loads a table listing all applications visible to the Dean. Chip filters at the top show Total, Pending, and Forwarded counts. By default all applications are shown.
3. Dean clicks the **Pending** chip to filter to applications awaiting action.
4. Dean finds an application and clicks its **Expand** button.
5. The row expands, showing:
   - A Document Checker status banner (Not yet run / All checks passed / Errors found).
   - Applicant details (email, ID number, GPA, OSYM points, university, enrollment status).
   - A document list with a **View** button for each of the five slots.
   - A "Previous return note" info-box if Dean has returned this same application before.
   - Two actions side by side: a **Forward to YGK** button, and a return form with a dropdown and a reason field.
6. Dean optionally clicks **View** on any document to review the PDF in a new browser tab.
7. Dean clicks **Forward to YGK**.
8. The page reloads on the Receive & Forward Applications tab.
9. A success message "Application forwarded to YGK successfully." appears at the top of the page.
10. The application row now shows "Forwarded To Ygk" status. Expanding it shows "Forwarded to: [department name]" instead of action buttons.

---

## Alternative Courses

**7.AC.1 — Dean returns the application instead of forwarding**

7a. Dean selects a return destination from the **Return to…** dropdown: "Return to Applicant", "Return to OIDB", or "Return to YDYO".  
7b. Dean types a reason into the text field below the dropdown. The **Return** button activates only after both the dropdown and the text field are filled.  
7c. Dean clicks **Return**.  
7d. The page reloads with a success message: "Application returned to [destination]."  
7e. The application leaves the Dean's table and goes back to the selected stage:

| Destination selected | Where the application goes |
|---|---|
| Return to Applicant | Back to the applicant for correction |
| Return to OIDB | Back to OIDB's Check Documents tab (status: Submitted, amber "From Dean" badge shown) |
| Return to YDYO | Back to YDYO's Set Prep School Status tab |

The Dean's written reason is saved and shown to whichever office receives it next.

**3.AC.1 — No pending applications are present**  
The table is empty or shows only already-forwarded rows. Dean filters by "Pending" and sees "No applications match this filter." No action can be taken.

**5.AC.1 — Doc Checker found errors**  
A red "Errors Found" banner lists the issues inside the expanded row. Dean can still click **Forward to YGK** — the doc checker result is advisory.

**5.AC.2 — Doc Checker was never run**  
A yellow "Doc Checker: Not yet run by OIDB" banner is shown. Dean can still forward or return.

**5.AC.3 — Application was previously returned by the Dean**  
A "Previous return note" info-box shows the reason Dean wrote the last time this application was returned. The forward and return actions work as normal.

**7.AC.2 — Dean tries to click Return without filling both fields**  
The **Return** button stays disabled until both the dropdown and the reason text field have a value. Dean cannot submit the return form with either field empty.

---

## Exceptions

- **EXC-1.** The system is unreachable (network error). The page fails to load; no status change occurs.

---

## Special Requirements

- SR-1. The **Forward to YGK** button is a direct submit with no confirmation dialog.
- SR-2. The **Return** button requires both a destination (dropdown) and a reason (text field) before it becomes clickable. Either field alone is not enough.
- SR-3. The YGK department the application is routed to is determined automatically by the system from the applicant's target program. Dean does not select the department manually.
- SR-4. All documents open in a new browser tab so Dean does not lose the current expand state.
- SR-5. Only one application row can be expanded at a time; opening a new row collapses the previous one.

---

## Assumptions

- No email notification is sent to the applicant or YGK when the status changes.
- Already-forwarded applications remain visible in the table under the "Forwarded" chip filter so Dean can review the routing outcome.

---
---

# Test Cases: Dean Forwards Application to YGK

---

## TC-DEAN-01 — Forward a pending application to YGK (happy path)

**Priority:** High  
**Preconditions:** Dean staff is logged in. At least one application with "Pending" status exists.

**Steps:**
1. Click the **Receive & Forward Applications** tab.
2. Click the **Pending** chip to filter to pending applications.
3. Click **Expand** on any row.
4. Click **Forward to YGK**.

**Expected Result:**
- The page reloads on the Receive & Forward Applications tab.
- A green success message "Application forwarded to YGK successfully." is shown.
- The application row now shows "Forwarded To Ygk" status badge.
- Expanding the row shows "Forwarded to: [department name]" — no action buttons are shown.
- The application is no longer visible under the Pending chip filter.

---

## TC-DEAN-02 — Expand row shows correct content before acting

**Priority:** High  
**Preconditions:** Dean staff is logged in. A pending application exists with all documents uploaded and a "Checked OK" doc checker result.

**Steps:**
1. Open the Receive & Forward Applications tab.
2. Click **Expand** on a pending application.

**Expected Result:**
- A green "Doc Checker: All checks passed." banner is shown.
- All five document slots are listed with a **View** button each.
- Applicant details (email, GPA, ID number, OSYM points, university, enrollment) are visible.
- **Forward to YGK** button is present and clickable.
- **Return** button is present but disabled.
- The **Return to…** dropdown shows "Return to…" as the default (no selection).
- The reason textarea is empty.

---

## TC-DEAN-03 — Return button stays disabled until both dropdown and reason are filled

**Priority:** High  
**Preconditions:** Dean staff is logged in. A pending application row is expanded.

**Steps:**
1. Select "Return to OIDB" from the dropdown. Observe the **Return** button.
2. Clear the dropdown back to "Return to…". Type a reason in the text field. Observe the **Return** button.
3. Select "Return to Applicant" from the dropdown AND type a reason. Observe the **Return** button.

**Expected Result:**
- After step 1 (dropdown filled, no reason): **Return** button remains disabled.
- After step 2 (reason filled, no dropdown): **Return** button remains disabled.
- After step 3 (both filled): **Return** button becomes enabled (clickable).

---

## TC-DEAN-04 — Return application to Applicant

**Priority:** High  
**Preconditions:** Dean staff is logged in. A pending application row is expanded.

**Steps:**
1. Select "Return to Applicant" from the dropdown.
2. Type a reason in the text field.
3. Click **Return**.

**Expected Result:**
- The page reloads with success message "Application returned to applicant."
- The application leaves the Dean's table.
- The applicant can see the return reason in their Track Application panel.

---

## TC-DEAN-05 — Return application to OIDB

**Priority:** High  
**Preconditions:** Dean staff is logged in. A pending application row is expanded.

**Steps:**
1. Select "Return to OIDB" from the dropdown.
2. Type a reason in the text field.
3. Click **Return**.

**Expected Result:**
- The page reloads with success message "Application returned to OIDB."
- The application appears in OIDB's Check Documents tab with "Submitted" status and an amber "From Dean" badge.
- OIDB can see the Dean's return note when they expand the row.

---

## TC-DEAN-06 — Return application to YDYO

**Priority:** High  
**Preconditions:** Dean staff is logged in. A pending application row is expanded.

**Steps:**
1. Select "Return to YDYO" from the dropdown.
2. Type a reason in the text field.
3. Click **Return**.

**Expected Result:**
- The page reloads with success message "Application returned to YDYO."
- The application reappears in YDYO's Set Prep School Status tab.
- YDYO can see the Dean's return note when they expand the row.

---

## TC-DEAN-07 — Application with doc checker errors can still be forwarded

**Priority:** Medium  
**Preconditions:** Dean staff is logged in. A pending application exists with doc checker errors (red "Errors Found" banner).

**Steps:**
1. Click **Expand** on the application with errors.
2. Read the error banner.
3. Click **Forward to YGK**.

**Expected Result:**
- The forward succeeds as in TC-DEAN-01.
- The errors banner was advisory; it did not block the action.

---

## TC-DEAN-08 — Application that was never doc-checked can still be forwarded

**Priority:** Medium  
**Preconditions:** Dean staff is logged in. A pending application exists that was never run through the doc checker (shows "Not yet run by OIDB" banner).

**Steps:**
1. Click **Expand** on that application.
2. Click **Forward to YGK**.

**Expected Result:**
- The forward succeeds as in TC-DEAN-01.

---

## TC-DEAN-09 — Previously returned application shows Dean's prior note

**Priority:** Medium  
**Preconditions:** Dean staff is logged in. An application exists that was returned by the Dean before and has since been resubmitted and forwarded back to the Dean.

**Steps:**
1. Click **Expand** on that application.

**Expected Result:**
- A "Previous return note" info-box is visible showing the reason the Dean wrote previously.
- Both **Forward to YGK** and the return form are still available.

---

## TC-DEAN-10 — Chip filter shows correct counts and filters table

**Priority:** Medium  
**Preconditions:** Dean staff is logged in. The table has both pending and already-forwarded applications.

**Steps:**
1. Open the Receive & Forward Applications tab. Note the Total, Pending, and Forwarded chip numbers.
2. Click the **Pending** chip.
3. Click the **Forwarded** chip.
4. Click the **Total** chip.

**Expected Result:**
- After step 2: only applications with "Pending" status are shown. The count matches the Pending chip number.
- After step 3: only applications with "Forwarded To Ygk" status are shown. The count matches the Forwarded chip number.
- After step 4: all applications are shown again.

---

## TC-DEAN-11 — Already-forwarded application shows no action buttons

**Priority:** Medium  
**Preconditions:** Dean staff is logged in. An application with "Forwarded To Ygk" status is visible.

**Steps:**
1. Click **Expand** on a forwarded application.

**Expected Result:**
- No **Forward to YGK** button is shown.
- No return form is shown.
- A line reads "Forwarded to: [department name]".

---

## TC-DEAN-12 — Viewing a document opens a new tab without closing the expanded row

**Priority:** Low  
**Preconditions:** Dean staff is logged in. A pending application with at least one uploaded document is expanded.

**Steps:**
1. Click **View** next to any document slot.

**Expected Result:**
- A new browser tab opens showing the PDF.
- The original tab remains on the dashboard with the expand row still open.

---

## TC-DEAN-13 — Only one expand row is open at a time

**Priority:** Low  
**Preconditions:** Dean staff is logged in. At least two application rows are visible.

**Steps:**
1. Click **Expand** on row A.
2. Click **Expand** on row B.

**Expected Result:**
- Row A collapses when row B opens.
- Only row B's details are visible.

---

## TC-DEAN-14 — Staff not signed in cannot access the tab

**Priority:** High  
**Preconditions:** Staff member is not logged in (no active session).

**Steps:**
1. Attempt to navigate directly to the dashboard URL.

**Expected Result:**
- The system redirects to the staff login page.
- No application data is shown.
