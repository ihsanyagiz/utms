# UC: OIDB Views and Exports Ranking Results

**Actor:** OIDB Staff  
**Priority:** High  
**Metadata:** Created 2026-06-06

---

## Use Case Description

OIDB staff views the final ranking table of applicants whose intibak evaluations are complete, optionally filters the list by target program, and downloads the ranking as an XLSX file — either with full names or with names partially masked for anonymous review.

---

## Preconditions

- PRE-1. OIDB staff is logged into the system.
- PRE-2. At least one applicant has completed the full pipeline and reached "Intibak Complete" status (sent to OIDB by YGK).

---

## Postconditions

- POST-1. OIDB has reviewed the on-screen ranking table.
- POST-2. (If downloaded) An XLSX file is saved to OIDB's computer containing the ranking data matching the current filter and anonymization settings.

---

## Normal Course of Events

1. OIDB navigates to the **Create Ranking Table** tab from the dashboard.
2. The tab loads and shows:
   - A **Filter by Program** dropdown (showing "All Programs" by default) and an applicant count chip.
   - An **Anonymize Applicants** checkbox and a **Download XLSX** button on the right.
   - A ranking table listing all intibak-complete applicants sorted from highest to lowest ranking score. Columns: rank (#), name, program, semester, OSYM points, current GPA, and ranking score (shown in purple).
3. OIDB reads through the ranking table to review the ranked order.
4. OIDB selects a specific program from the **Filter by Program** dropdown.
5. The table dims briefly and reloads showing only applicants in that program, re-ranked from 1. The applicant count chip updates.
6. OIDB clicks **Download XLSX**.
7. An XLSX file is downloaded to the computer containing the same applicants currently shown in the table (filtered to the selected program), with full names visible.

---

## Alternative Courses

**4.AC.1 — OIDB selects "All Programs" from the filter**  
The table reloads showing all intibak-complete applicants across all programs, sorted by ranking score.

**6.AC.1 — OIDB checks "Anonymize Applicants" before downloading**  
OIDB ticks the checkbox, then clicks **Download XLSX**. In the downloaded file, each applicant's name is partially masked: the first three characters of each name part are kept and the rest are replaced with asterisks (e.g., "Mehmet Yilmaz" → "Meh**** Yil****"). The on-screen table is not affected — full names remain visible there.

**6.AC.2 — OIDB downloads with both a program filter and anonymization active**  
The downloaded file contains only applicants in the selected program, with names masked.

---

## Exceptions

- **EXC-1.** No intibak-complete applications exist yet. The table is still shown with its header row, but the body displays "No intibak-complete applications yet." The Download XLSX button is still present; the downloaded file will contain only the header row.
- **EXC-2.** The selected program filter matches no intibak-complete applications. The table body shows "No intibak-complete applications for [program name]." The table header and filter controls remain visible.

---

## Special Requirements

- SR-1. Ranking scores are read-only on this screen. They were computed by the system when YGK sent each applicant's intibak table to OIDB. OIDB cannot change or reorder them manually.
- SR-2. The **Anonymize Applicants** checkbox only affects the downloaded file. The table on screen always shows full names.
- SR-3. The table and filter controls are always rendered, even when the result is empty. The table never collapses.
- SR-4. The downloaded file name includes the year and the exact download date and time (e.g., "UTMS Ranking for 2026 06-06-2026-14-32-00.xlsx" or "Anonymized UTMS Ranking for 2026 06-06-2026-14-32-00.xlsx").

---

## Assumptions

- The ranking score for each applicant was calculated by the system as: `(OSYM / 560) × 90 + (GPA / 4.0) × 10`, giving a score between 0 and 100. OIDB does not need to calculate or verify this manually.
- Only applicants with status "Intibak Complete" appear in this table. Applicants still in progress are not shown.

---
---

# Test Cases: OIDB Views and Exports Ranking Results

---

## TC-RANK-01 — Ranking table loads with all intibak-complete applicants

**Priority:** High  
**Preconditions:** OIDB staff is logged in. At least two intibak-complete applicants exist with different ranking scores.

**Steps:**
1. Click the **Create Ranking Table** tab.

**Expected Result:**
- The table loads showing all intibak-complete applicants.
- The first row has the highest ranking score; each subsequent row has an equal or lower score.
- Columns shown: #, Name, Program, Semester, OSYM, GPA (Current), Ranking Score.
- The applicant count chip shows the correct number.
- The **Filter by Program** dropdown shows "All Programs" as the default.
- The **Anonymize Applicants** checkbox is unchecked by default.

---

## TC-RANK-02 — Filter by a specific program

**Priority:** High  
**Preconditions:** OIDB staff is logged in. Intibak-complete applicants exist in more than one program.

**Steps:**
1. Open the Create Ranking Table tab.
2. Select a specific program from the **Filter by Program** dropdown.

**Expected Result:**
- The table dims briefly, then reloads.
- Only applicants in the selected program are shown.
- The rank column resets to 1 for the top applicant in that program.
- The applicant count chip updates to the number of filtered applicants.

---

## TC-RANK-03 — Select "All Programs" restores the full list

**Priority:** Medium  
**Preconditions:** A program filter is currently active.

**Steps:**
1. Select **All Programs** from the dropdown.

**Expected Result:**
- The table reloads showing all intibak-complete applicants from all programs.
- The applicant count chip reflects the total count.

---

## TC-RANK-04 — Filter with no matching applicants shows empty state

**Priority:** Medium  
**Preconditions:** OIDB staff is logged in. A program exists in the dropdown that has no intibak-complete applicants.

**Steps:**
1. Select that program from the dropdown.

**Expected Result:**
- The table body shows "No intibak-complete applications for [program name]."
- The table header row (columns) is still visible.
- The filter dropdown and Download XLSX button remain usable.

---

## TC-RANK-05 — Tab shows empty state when no intibak-complete applicants exist at all

**Priority:** Medium  
**Preconditions:** OIDB staff is logged in. No application has reached "Intibak Complete" status yet.

**Steps:**
1. Click the Create Ranking Table tab.

**Expected Result:**
- The table body shows "No intibak-complete applications yet."
- The table header row is still visible.
- The filter dropdown and Download XLSX button are still shown.

---

## TC-RANK-06 — Download XLSX (all programs, no anonymization)

**Priority:** High  
**Preconditions:** OIDB staff is logged in. The Create Ranking Table tab is open showing all programs.

**Steps:**
1. Ensure "All Programs" is selected and the Anonymize checkbox is unchecked.
2. Click **Download XLSX**.

**Expected Result:**
- An XLSX file downloads to the computer.
- The filename begins with "UTMS Ranking for [year]" and includes the current date and time.
- The file contains one row per applicant with columns: Rank, Name, Program, Semester, OSYM, GPA (Current), Ranking Score.
- Names are shown in full.
- Applicants are ordered from highest to lowest ranking score.

---

## TC-RANK-07 — Download XLSX with a program filter active

**Priority:** High  
**Preconditions:** A program filter is selected in the dropdown.

**Steps:**
1. With a program selected in the dropdown, click **Download XLSX**.

**Expected Result:**
- The downloaded file contains only applicants from the selected program.
- The filename includes the current date and time (not the program name).

---

## TC-RANK-08 — Download XLSX with Anonymize checked

**Priority:** High  
**Preconditions:** OIDB staff is logged in. The Create Ranking Table tab is open.

**Steps:**
1. Check the **Anonymize Applicants** checkbox.
2. Click **Download XLSX**.

**Expected Result:**
- The file downloads with a filename starting "Anonymized UTMS Ranking for [year]".
- In the Name column, each name part longer than 3 characters has its remaining letters replaced with asterisks (e.g., "Aykhan Aliyev" → "Ayk*** Ali****").
- Name parts 3 characters or shorter are left unchanged.
- All other columns (rank, program, OSYM, GPA, score) are unmasked.

---

## TC-RANK-09 — Anonymize checkbox does not affect the on-screen table

**Priority:** Medium  
**Preconditions:** OIDB staff is logged in.

**Steps:**
1. Check the **Anonymize Applicants** checkbox.
2. Observe the ranking table on screen.

**Expected Result:**
- Full applicant names remain visible in the table.
- The checkbox only affects the downloaded file.

---

## TC-RANK-10 — Download XLSX with program filter and anonymization combined

**Priority:** Medium  
**Preconditions:** OIDB staff is logged in. Multiple programs have intibak-complete applicants.

**Steps:**
1. Select a specific program from the dropdown.
2. Check the **Anonymize Applicants** checkbox.
3. Click **Download XLSX**.

**Expected Result:**
- The downloaded file contains only applicants from the selected program.
- Names are partially masked.
- The filename starts with "Anonymized UTMS Ranking for [year]".

---

## TC-RANK-11 — Staff not signed in cannot access the tab

**Priority:** High  
**Preconditions:** Staff member is not logged in (no active session).

**Steps:**
1. Attempt to navigate directly to the dashboard URL.

**Expected Result:**
- The system redirects to the staff login page.
- No ranking data is shown.
