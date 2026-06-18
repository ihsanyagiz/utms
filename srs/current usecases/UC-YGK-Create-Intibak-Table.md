# UC: YGK Creates Intibak Table

**Actor:** YGK Staff  
**Priority:** High  
**Metadata:** Created 2026-06-06

---

## Use Case Description

YGK staff selects an applicant from their department's queue, opens the intibak (course equivalency) table for that applicant, fills in the applicant's home-university courses and their equivalents from the target curriculum, assigns grades, and sends the completed table to OIDB for ranking.

---

## Preconditions

- PRE-1. YGK staff is logged into the system.
- PRE-2. At least one application forwarded to YGK is visible in the Check Applicants tab for this staff member's department.

---

## Postconditions

- POST-1. The intibak table is saved with all courses and grades entered by YGK.
- POST-2. The application's ranking score (calculated from the applicant's submitted GPA and OSYM points) is stored.
- POST-3. The application's status changes to "Intibak Complete".
- POST-4. The application appears in OIDB's Create Ranking Table tab.
- POST-5. In the Check Applicants tab the application row shows "Intibak Complete ✓" and no longer has an "Open Intibak Table" button.

---

## Normal Course of Events

### Phase 1 — Select an applicant

1. YGK navigates to the **Check Applicants** tab from the dashboard.
2. The tab shows a table of applicants forwarded to YGK's department. Chip filters at the top show Total, Pending, and Approved counts.
3. YGK clicks **Expand** on a pending applicant row.
4. The row expands showing applicant details (email, ID number, GPA, OSYM points, university, enrolled status, program, semester, prep school status) and workflow info (status, submission date, routing department). If the application was returned by the Dean before, a Dean note info-box is also shown.
5. YGK clicks **Open Intibak Table →**.
6. The dashboard switches to the **Intibak Table** tab, loading the table for the selected applicant.

### Phase 2 — Fill the intibak table

7. The tab shows the applicant's name, home university, GPA, and an **Open Transcript** link at the top. YGK optionally clicks **Open Transcript** to review the transcript PDF in a new tab.
8. The page has three sections:
   - **Applicant's Courses (Home University)** — left table, manual entry.
   - **Equivalent Courses (Target University)** — right table, filled from the curriculum.
   - **Courses to be Taken** — bottom table, filled from the curriculum.
9. A **Ranking Score** badge (purple, range 0–100) is shown below the right table. It is pre-calculated from the applicant's submitted GPA and OSYM points and does not change as courses are entered.

### Phase 3 — Add applicant's home-university courses (left table)

10. YGK fills in the input row at the bottom of the left table: course name (required), credits (required), AKTS (required), and optionally a grade from the dropdown.
11. YGK clicks **Add**. The course row appears in the left table immediately.
12. YGK repeats steps 10–11 for each course from the applicant's transcript.

### Phase 4 — Add equivalent courses from the target curriculum (right table)

13. YGK clicks **+ Add from Curriculum** below the right table.
14. A floating curriculum picker panel appears with a search field and a list of courses from the target program's curriculum (code, name, credits, AKTS).
15. YGK optionally types in the search field to filter courses by code or name.
16. YGK clicks **Select** (or double-clicks) on the desired course. The picker closes and the course appears as a new row in the right table with no grade set yet.
17. YGK repeats steps 13–16 for each equivalent course.

### Phase 5 — Add courses the applicant must take (bottom table)

18. YGK clicks **+ Add from Curriculum** below the bottom table and uses the same picker to add courses the applicant is required to take at the target university. These rows have no grade column.

### Phase 6 — Assign grades

19. YGK changes the grade dropdown on any row in the left or right tables. The grade saves automatically — no separate save button is needed.
20. Optionally, YGK uses **Connect Rows** to calculate grades automatically:
    - YGK clicks **Connect Rows**. The button turns blue and a hint line appears.
    - YGK clicks one or more rows in the left table (they highlight blue).
    - YGK clicks one row in the right table (it highlights green).
    - YGK clicks **Confirm Connection**. The system calculates an AKTS-weighted grade from the selected left rows and applies it to the right row. The right row flashes green briefly to confirm.
    - To cancel at any time, YGK presses **Escape**.

### Phase 7 — Send to OIDB

21. YGK clicks **Send to OIDB** at the bottom of the page.
22. The button turns green and shows "Sent ✓". An inline message reads "Intibak complete — application forwarded to OIDB for ranking."
23. The Check Applicants tab refreshes in the background. The applicant's row now shows "Intibak Complete ✓" instead of the "Open Intibak Table" button.

---

## Alternative Courses

**5.AC.1 — Applicant's intibak is already complete**  
In the Check Applicants expand row, a greyed-out "Intibak Complete ✓" label is shown instead of the "Open Intibak Table" button. YGK cannot open the intibak table for that applicant again.

**10.AC.1 — YGK tries to add a left-table course without filling required fields**  
Clicking **Add** with an empty course name, credits, or AKTS field does not submit the row; focus jumps to the first empty required field. No row is added.

**16.AC.1 — Curriculum picker is closed without selecting**  
YGK clicks ✕ or clicks anywhere outside the picker panel. The picker closes with no change to any table.

**20.AC.1 — Connect Rows: only left rows selected, no right row**  
Clicking **Confirm Connection** with no right row selected exits connection mode without making any changes.

**20.AC.2 — Connect Rows: only a right row selected, no left rows**  
Same as above — confirming without left rows selected exits connection mode without any grade change.

**21.AC.1 — Send to OIDB fails (network or server error)**  
The button turns red briefly and an error message appears inline. The button re-enables after a short delay, allowing YGK to retry. Application status is unchanged.

---

## Exceptions

- **EXC-1.** The system is unreachable. The page fails to load or AJAX calls fail; no data is saved.

---

## Special Requirements

- SR-1. All grade changes in the left and right tables autosave immediately when the dropdown changes. There is no manual save button for individual rows.
- SR-2. The **Courses to be Taken** table has no grade column — it records only what courses the applicant must still complete.
- SR-3. The left table (home-university courses) uses manual entry only; it does not have a curriculum picker.
- SR-4. The ranking score displayed on the page is read-only. It is computed from the applicant's submitted GPA and OSYM points, not from the grades entered in the intibak table.
- SR-5. **Send to OIDB** does not reload the page; it updates the button and shows an inline message. The Check Applicants tab refreshes in the background.
- SR-6. Deleting a course row is immediate — the row disappears without a confirmation dialog.

---

## Assumptions

- YGK only sees applications routed to their specific department. Applicants from other departments are not shown.
- The transcript PDF (slot 2) is the main reference document for filling the left table.
- No notification is sent to the applicant or OIDB when the table is sent.

---
---

# Test Cases: YGK Creates Intibak Table

---

## TC-YGK-01 — Navigate to the Intibak Table tab via Check Applicants

**Priority:** High  
**Preconditions:** YGK staff is logged in. At least one pending application exists in the department queue.

**Steps:**
1. Click the **Check Applicants** tab.
2. Click **Expand** on a pending application row.
3. Click **Open Intibak Table →**.

**Expected Result:**
- The dashboard switches to the **Intibak Table** tab.
- The applicant's name, home university, and GPA are shown in the top info bar.
- Three empty or partially-filled tables are visible: Applicant's Courses, Equivalent Courses, Courses to be Taken.
- The Ranking Score badge is shown with the applicant's pre-computed score.

---

## TC-YGK-02 — Intibak Table tab shows prompt when no applicant is selected

**Priority:** Medium  
**Preconditions:** YGK staff is logged in.

**Steps:**
1. Click the **Intibak Table** tab directly (without going through Check Applicants first).

**Expected Result:**
- The tab shows: "No applicant selected. Go to Check Applicants, expand an application row and click Open Intibak Table."
- No table or course data is displayed.

---

## TC-YGK-03 — Add a course to the left table (Applicant's Courses)

**Priority:** High  
**Preconditions:** YGK staff is logged in. Intibak Table tab is open for an applicant.

**Steps:**
1. In the **Applicant's Courses** table, fill in the input row: type a course name, enter credits, enter AKTS, and select a grade from the dropdown.
2. Click **Add**.

**Expected Result:**
- A new row appears in the left table immediately with the entered data.
- The input row clears, ready for the next course.
- No page reload occurs.

---

## TC-YGK-04 — Adding a left-table course without a name is blocked

**Priority:** Medium  
**Preconditions:** Intibak Table tab is open for an applicant.

**Steps:**
1. Leave the course name field empty. Fill in credits and AKTS.
2. Click **Add**.

**Expected Result:**
- No row is added.
- Focus jumps to the course name field.

---

## TC-YGK-05 — Adding a left-table course without credits or AKTS is blocked

**Priority:** Medium  
**Preconditions:** Intibak Table tab is open for an applicant.

**Steps:**
1. Fill in a course name. Leave credits empty. Fill in AKTS. Click **Add**.
2. Fill in a course name and credits. Leave AKTS empty. Click **Add**.

**Expected Result:**
- Neither attempt adds a row.
- Focus jumps to the first empty required field in each case.

---

## TC-YGK-06 — Add an equivalent course from the curriculum picker (right table)

**Priority:** High  
**Preconditions:** Intibak Table tab is open for an applicant.

**Steps:**
1. Click **+ Add from Curriculum** below the **Equivalent Courses** table.
2. The curriculum picker panel opens with a list of courses.
3. Click **Select** on any course.

**Expected Result:**
- The picker closes.
- The selected course appears as a new row in the Equivalent Courses table with its code, name, credits, and AKTS filled in. Grade is blank.

---

## TC-YGK-07 — Curriculum picker search filters results

**Priority:** Medium  
**Preconditions:** Curriculum picker is open.

**Steps:**
1. Type a course code or partial name into the search field.

**Expected Result:**
- The list updates to show only courses whose code or name contains the typed text.
- Courses that do not match are hidden.
- Clearing the search field restores the full list.

---

## TC-YGK-08 — Closing the curriculum picker without selecting adds nothing

**Priority:** Low  
**Preconditions:** Curriculum picker is open.

**Steps:**
1. Click the ✕ button on the picker, or click anywhere outside the picker panel.

**Expected Result:**
- The picker closes.
- No course is added to any table.

---

## TC-YGK-09 — Add a course to Courses to be Taken

**Priority:** Medium  
**Preconditions:** Intibak Table tab is open for an applicant.

**Steps:**
1. Click **+ Add from Curriculum** below the **Courses to be Taken** table.
2. Select a course from the picker.

**Expected Result:**
- The picker closes.
- The course appears in the Courses to be Taken table with code, name, credits, and AKTS. There is no grade column on this table.

---

## TC-YGK-10 — Delete a course row

**Priority:** Medium  
**Preconditions:** The left, right, or bottom table has at least one row.

**Steps:**
1. Click the ✕ button on any course row.

**Expected Result:**
- The row disappears immediately from the table.
- No confirmation dialog appears.
- No page reload occurs.

---

## TC-YGK-11 — Grade change autosaves

**Priority:** High  
**Preconditions:** The left or right table has at least one row.

**Steps:**
1. Change the grade dropdown on any course row to a different value.

**Expected Result:**
- The grade is saved automatically without clicking any Save button.
- No page reload occurs.
- If the grade dropdown is changed back, that also saves.

---

## TC-YGK-12 — Connect Rows: AKTS-weighted grade is applied to right row

**Priority:** Medium  
**Preconditions:** The left table has at least one row with a grade and AKTS. The right table has at least one row.

**Steps:**
1. Click **Connect Rows**. The button turns blue and a hint line appears.
2. Click one or more rows in the left table (they highlight blue).
3. Click one row in the right table (it highlights green).
4. Click **Confirm Connection**.

**Expected Result:**
- The right row's grade dropdown is set to the AKTS-weighted result of the selected left rows.
- The right row flashes green briefly to confirm the change.
- Connection mode exits: button returns to normal, highlights clear.
- The grade is saved automatically.

---

## TC-YGK-13 — Confirming Connect Rows with incomplete selection makes no changes

**Priority:** Low  
**Preconditions:** Connection mode is active.

**Steps (variant A):** Select left rows only, no right row. Click **Confirm Connection**.  
**Steps (variant B):** Select a right row only, no left rows. Click **Confirm Connection**.

**Expected Result:**
- In both cases, connection mode exits cleanly.
- No grades are changed.

---

## TC-YGK-14 — Escape cancels Connect Rows mode

**Priority:** Low  
**Preconditions:** Connection mode is active with rows highlighted.

**Steps:**
1. Press **Escape**.

**Expected Result:**
- Connection mode exits immediately.
- All highlights are cleared.
- No grades are changed.

---

## TC-YGK-15 — Send to OIDB (happy path)

**Priority:** High  
**Preconditions:** YGK staff is logged in. Intibak Table tab is open for a pending applicant with courses entered.

**Steps:**
1. Click **Send to OIDB**.

**Expected Result:**
- The button turns green and its label changes to "Sent ✓".
- An inline message reads "Intibak complete — application forwarded to OIDB for ranking."
- No page reload occurs.
- The Check Applicants tab refreshes in the background. After a moment, that applicant's row shows "Intibak Complete ✓" (greyed out, non-clickable) instead of "Open Intibak Table →".
- The Approved chip count in the Check Applicants tab increases by one.

---

## TC-YGK-16 — Already-completed applicant shows no Open Intibak Table button

**Priority:** Medium  
**Preconditions:** YGK staff is logged in. An application with "Intibak Complete" status exists.

**Steps:**
1. Open the Check Applicants tab.
2. Click the **Approved** chip.
3. Click **Expand** on the completed applicant.

**Expected Result:**
- The expand row shows a greyed-out "Intibak Complete ✓" label in the action area.
- There is no "Open Intibak Table →" button.

---

## TC-YGK-17 — Open Transcript opens a new tab without leaving the intibak table

**Priority:** Low  
**Preconditions:** Intibak Table tab is open for an applicant who uploaded a transcript.

**Steps:**
1. Click **Open Transcript** in the top info bar.

**Expected Result:**
- A new browser tab opens showing the transcript PDF.
- The original tab remains on the Intibak Table, unchanged.

---

## TC-YGK-18 — Export to JSON downloads a file

**Priority:** Low  
**Preconditions:** Intibak Table tab is open for an applicant.

**Steps:**
1. Click **Export to JSON**.

**Expected Result:**
- A JSON file is downloaded to the user's computer.
- The file is named with the applicant's ID and name.
- The page does not reload.

---

## TC-YGK-19 — Staff not signed in cannot access the tabs

**Priority:** High  
**Preconditions:** Staff member is not logged in (no active session).

**Steps:**
1. Attempt to navigate directly to the dashboard URL.

**Expected Result:**
- The system redirects to the staff login page.
- No application data is shown.
