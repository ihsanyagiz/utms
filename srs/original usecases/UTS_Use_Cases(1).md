# UTS System Use Cases (Extracted from G9 SRS V2)

## 1. Applicant Use Cases

### UC-1: Register to System
**Actor:** Applicant
**Description:** Applicant registers for the system.
**Priority:** High | **Frequency:** Once per applicant
**Metadata:** Created by Muhammed Emin Kılıçaslan (13.11.2025), Updated by Enes Kaya (14.11.2025)

**Preconditions:**
* PRE-1. Applicant entered the interface of register step.
* PRE-2. Applicant doesn’t already have an existing account.
* PRE-3. Applicant already has a personal e-mail account.

**Postconditions:**
* POST-1. An account is recorded in the system for the applicant.

**Normal Course of Events:**
1. Applicant enters e-mail address, password, TC no., full name and phone number to corresponding input fields.
2. Applicant presses the "Register Account" button.
3. System sends an e-mail with a confirmation link to the entered e-mail address.
4. Applicant accesses their e-mail inbox and clicks on the confirmation link in the e-mail address.

**Alternative Courses:**
* 1.AC.1. Applicant enters at least one field incorrectly -> 1. Notify applicant about the incorrect field and return to step 1.
* 5.AC.1. Applicant doesn’t click the link in time -> 1. Notify the applicant that they didn’t confirm the e-mail address in time and return to step 1 of the normal course.

**Exceptions:** None
**Includes:** None

**Special Requirements:**
* E-mail address must be a valid address.
* Password must be at least 8 characters long and less than 32 characters long.
* Password must only consist of English characters, digits and underscores.
* TC no. Must be 11 digits and end with an even character.
* Full name can only have English and Turkish characters and space.
* Phone number must only consist of digits.

**Assumptions:** None
**Notes and Issues:** Consider using native elements for inputs such as phone no, TC. no, and e-mail address.

---

### UC-2: Log In
**Actor:** Applicant
**Description:** The user logs into the system.
**Priority:** High | **Frequency:** 2000/year
**Metadata:** Created by Canse Coşar (13.11.2025), Updated by Aykhan Aliyev (13.11.2025)

**Preconditions:**
* PRE-1. Applicant entered the interface of the login step.
* PRE-2. Applicant should have already registered in the system.

**Postconditions:**
* POST-1. Applicant entered the home page of the system.

**Normal Course of Events:**
1. Applicant enters the email and password.
2. Applicant presses to the ‘Login’ button.
3. System checks whether email and password matches.
4. Applicant access to the home page.

**Alternative Courses:**
* 2.AC.1. User enters Invalid email or password -> 1. User is notified as ‘Email and password doesn’t match’ and redirected to the login page.
* 4.AC.1. Applicant presses the ‘I forgot my password.’ Button. -> 1. Applicant is directed to UC-3.

**Exceptions:**
* 4.1EX1. The time period of the activation is closed. -> 1. Notifies user and redirect to the login page.

**Includes:** UC-3
**Special Requirements:** A user does not access to system from two different instances simultaneously.
**Assumptions:** This system will be activated in a particular time period of each year that is announced earlier.

---

### UC-3: Reset the password
**Actor:** Applicant, E-Devlet
**Description:** In the event that the applicant forgets or loses their current system login password, the procedure enables them to safely create a new password via email verification or identity validation.
**Priority:** High | **Frequency:** 30/year
**Metadata:** Created by Arda Yılmaz (13.11.2025), Updated by Arda Yılmaz (13.11.2025)

**Preconditions:**
* PRE-1. The Applicant must have clicked on the Forgot Password link.
* PRE-1(b). The Applicant is viewing the Login Screen.

**Postconditions:**
* POST-1. The Applicant can successfully log into the system with the new password.

**Normal Course of Events:**
1. Clicks on the forgot the password link on the login screen.
2. Enters the registered email address and submits it.
3. System checks whether email exist in the database of the system.
4. System sends a password reset email to the user.
5. The applicant checks their email and clicks the reset link.
6. The applicant enters their new password.
7. The system checks if the password meets the required criteria.
8. The system displays a confirmation message to applicant that the password has been successfully reset.
9. The system sends a message that the password has been reset.

**Alternative Courses:**
* 1.AC.1 Applicant logs in via E-Devlet system. The System redirects user to E-Devlet login. Upon success, flow skips to Step 6.
* 1.AC.2 Return to step 1 of the normal course the applicant ID is used instead of the email. The System validates ID format instead of email.
* 2.AC.1 The system cannot find a registered email. The System displays a "User not found" error message and prompts the user to retry returns to Step 2.
* 3.AC.2 The applicant cannot meet the required password criteria. The System displays a warning message listing missing criteria and clears the input field returns to Step 6.

**Exceptions:**
* 1.EX.1. The system fails to send the email. The System displays a "Service Temporarily Unavailable" message.
* 2.EX.1. The Applicant's account may be locked by the system following failed login attempts. The System displays an "Account Locked" alert and prevents the reset process.
* 3.Ex.1. The database connection fails. The System shows a generic technical error message and logs the incident.

**Special Requirements:** No concurrent sessions allowed.

---

### UC-4: Submit the documents
**Actor:** Applicant
**Description:** Applicants submit necessary documents to the website. which are verified by an automated script by the system.
**Priority:** High | **Frequency:** 100/year
**Metadata:** Created by Ali Alp Haraç (13.11.2025), Updated by Muhammed Emin Kılıçaslan (21.11.2025)

**Preconditions:**
* PRE-1. Should be on the applicant submit screen.
* PRE-2. Applicants must upload all the necessary documents.

**Postconditions:**
* POST-1. The application will give you feedback that you have successfully sent the documents.
* POST-2. The application will give you feedback that you have submitted incorrect or incomplete documents.

**Normal Course of Events:**
1. The system checks whether all documents have been uploaded.
2. The system checks whether the uploaded documents are in the requested extension format.
3. The system checks whether the file size is the required size.
4. Applicant successfully uploads documents.

**Alternative Courses:**
* 1.AC.1. Any of the necessary files missing -> 1. Applicant prompted to update the results. 2. Process moved to UC-6
* 1.AC.2. Applicant uploads incorrect documents -> 1. Notification is sent to the applicant that documents are incorrect. 2. Process moved to UC-6

**Exceptions:**
* 4.EX.1 An error occurs in the system -> 1. Notify the user, refresh the page and try again.

**Special Requirements:** 1. Criminal record, 2. Proficiency on English, 3. Applicants transcript, 4. Curriculum of the course the applicant accomplished
**Assumptions:** This system will be activated in a particular time period of each year that is announced earlier.

---

### UC-5: Track result
**Actor:** Applicant
**Description:** Applicant tracks for realtime application results
**Priority:** Medium | **Frequency:** 2000/year
**Metadata:** Created by Aykhan Aliyev (13.11.2025), Updated by Muhammed Emin Kılıçaslan (21.11.2025)

**Preconditions:**
* PRE-1 Applicant is logged in
* PRE-2 Applicant has internet connection
* PRE-3 Applicant has applied to system

**Postconditions:**
* POST-1 Applicant gets result of his application

**Normal Course of Events:**
1. Applicant presses “Track result” button
2. System checks for status of application
3. System checks where is application
4. Applicant views a current status of application

**Exceptions:**
* 2.EX.1a System cant find the Application -> Applicant gets an error message of missing application
* 2.EX.1b System is not working -> Application gets an error message of system not working

---

### UC-6: Resubmit Application
**Actor:** Applicant
**Priority:** Low | **Frequency:** 2 /per student in average
**Metadata:** Created by Canse Coşar (13.11.2025), Updated by Aykhan Aliyev (09.05.2026)

**Preconditions:**
* PRE-1. Applicant had already submitted the documents before.
* PRE-2. Applicant had completed the application before.
* PRE-3. Every document is compulsory, they can’t be removed without updating with the new ones.
* PRE-4. Deadline for documents didn’t expired yet.

**Postconditions:**
* POST-1. Applicant updated the documents.

**Normal Course of Events:**
1. Applicant presses the ‘Update Documents’ button.
2. Applicant views the documents list that is already submitted and also the message of why was it rejected.
3. Applicant clicks the ‘Update’ button that is next to the document that system asked to be resubmitted.
4. “File Picker” is now opened.
5. Applicant clicks to the file to set it as new file.
6. Applicant clicks ‘Submit Updated Application’ button.
7. New application is assigned and updated with the new documents.

**Exceptions:**
* 5.EX.1. Updated document format is not supported. (e.g.not PDF or DOCX) -> 1. System shows an error: “Unsupported file format.” 2. Applicant redirected to Step 2 in normal course.
* 6.EX.2. The file upload fails due to network issues -> 1. System shows a warning: “Upload failed. Please check your internet connection and try again.” 2. Applicant redirected to Step 2 in normal course.

---

### UC-21: Applicant cancels the application
**Actor:** Applicant
**Description:** Applicant cancels the application via system UI.
**Priority:** Middle | **Frequency:** Up to once for each application
**Metadata:** Created by Emin Kılıçaslan (23.11.2025)

**Preconditions:**
* PRE-1. Applicant has logged in to web UI.
* PRE-2. The applicant has submitted an application to the system.
* PRE-3. Enrollment time interval has yet to start.

**Postconditions:**
* POST-1. The relevant application dropped from further process.
* POST-2. Application moved from an active applications list and entered into cancelled applications.

**Normal Course of Events:**
1. Applicant presses button to list active applications.
2. Applicant chooses the active application by clicking on it.
3. System loads the application details.
4. Applicant presses button to cancel application.
5. A pop-up window asks for confirmation.
6. Applicant presses the button to confirm.
7. Another pop-up window informs the student about the cancelled application.

**Alternative Courses:**
* 5.AC.1. The applicant presses the button to cancel the cancellation process. -> 1. Pop up window disappears and loads back to step 3.

**Exceptions:**
* 1.EX.1. The home page fails to load. -> 1. System gives an informative error as ‘Failed to load. Please try again later.’
* 2.EX.1. Connection fails before the application list is loaded. -> 1. System gives an error message as ‘Failed to load while loading. Please try again later.’

**Includes:** UC-5 Track application
**Assumptions:** 1. Applicant’s cancellation is permanent.

---

### UC-33: Log in with E-Devlet
**Actor:** Applicant
**Description:** The user logs into the system with E-Devlet.
**Priority:** High | **Frequency:** 2000/year
**Metadata:** Created by Aykhan Aliyev (09.05.2026)

**Preconditions:**
* PRE-1. Applicant entered the interface of the login step.
* PRE-2. Applicant should have already registered in the system.

**Postconditions:**
* POST-1. Applicant entered the home page of the system.

**Normal Course of Events:**
1. Applicant presses to the ‘Login via E-Devlet’ button.
2. Authorization is checked via E-Devlet.
3. Applicant access to the home page.

**Alternative Courses:**
* 1.AC.2 Authorization via E-Devlet failed. -> 1. Notify user about failed attempt and return to log in page

**Exceptions:**
* 1.1EX1. An error has occurred in E-Devlet services. -> 1. Notifies user and redirect to the login page.
* 2.EX1. The time period of the activation is closed. -> 1. Notifies user and redirect to the login page.

**Includes:** UC-2, UC-3
**Special Requirements:** A user does not access to system from two different instances simultaneously.

---

## 2. Dean’s Office Use Cases

### UC-7: Receive the documents
**Actor:** Dean’s Office
**Description:** Dean’s Office retrieves the application from the user interface.
**Priority:** High | **Frequency:** Once for all applications and once for eligible applications per year.
**Metadata:** Created by Emin Kılıçaslan (13.11.2025)

**Preconditions:**
* PRE-1. Dean’s Office has logged into the system with proper credentials.
* PRE-2. Dean’s Office has reached the home page of web UI
* PRE-3. The Dean’s Office possesses permission to review applications.
* PRE-4. At least one application was submitted to the faculty.
* PRE-5. The admission period has ended.

**Postconditions:**
* POST-1. The Dean’s Office obtains all the applications for that faculty.

**Normal Course of Events:**
1. Dean’s Office staff presses the button to list applications.
2. Dean’s Office staff reviews the loaded list and moves forward use case (UC-8).

**Exceptions:**
* 1.EX.1 Server is down
* 1.EX.2 Internet connection cuts before retrieving the lists.

**Includes:** UC-8

---

### UC-8: Forward the document
**Actor:** Dean’s office
**Description:** Dean forwards the application documents to respective departments
**Priority:** Medium | **Frequency:** Once for all applications and once for eligible applications per year.
**Metadata:** Created by Aykhan Aliyev (13.11.2025), Updated by Emin Kılıçaslan (21.11.2025)

**Preconditions:**
* PRE-1 Dean’s office has logged in into the system
* PRE-1 Dean’s office has received documents (UC-7)
* PRE-2 Dean’s office is connected to the system

**Postconditions:**
* POST-1 Application documents sent to respective Faculty Departments

**Normal Course of Events:**
1. Dean’s office presses button to automatically forward applications
2. System forwards application to respective departments

**Alternative Courses:**
* 1.AC.1 System encounters error -> 1. Deans office manually check application, 2. Dean’s office manually selects respective department, 3. Dean’s office presses button to forward application to respective department

**Exceptions:**
* 2.EX.1 System is not working

**Includes:** UC-7

---

## 3. YGK Staff Use Cases

### UC-18: Create the Intibak Tables
**Actor:** YGK
**Description:** The YGK member prepares and approves the course intibak tables.
**Priority:** High | **Frequency:** Once for each applicant's previous institution per year.
**Metadata:** Created by İhsan Yağız Sakızlıoğlu (13.11.2025)

**Preconditions:**
* PRE-1. The YGK Member is logged into the system.
* PRE-2. Transcripts and curriculum data for the primary and waitlisted applicants are available in the system.

**Postconditions:**
* POST-1. A draft intibak table is generated based on course matches.
* POST-2. The evaluation report and intibak form are submitted to the Faculty Dean's Office.

**Normal Course of Events:**
1. YGK Member selects a primary or waitlisted applicant from the pending list to prepare the intibak table.
2. YGK Member reviews the system-generated matches and performs manual adjustments (e.g., changing a matched course or rejecting an equivalence) if necessary.
3. YGK Member clicks the "Save" button to finalize the preparation of the table.

**Alternative Courses:**
* 3.AC.1. Matching Script Error -> System encounters an error while executing the ECTS matching script. System displays a warning. System generates a completely blank intibak table structure. The flow continues from step of the Normal Course (but fully manual).

**Exceptions:**
* 2.EX.1. Transcript Data Retrieval Failure -> System fails to retrieve the applicant's transcript data. System displays an error message. System prevents the intibak table generation and redirects the YGK Member to the main dashboard.

**Includes:** 1. View Applicant Data, 2. Search Course Catalog

**Special Requirements:**
1. The system must validate course equivalences according to the "IZTECH Course Equivalence and Intibak Directive"
2. The user interface must provide a side-by-side view to compare the applicant's transcript/course contents with the IZTECH curriculum facilitating manual review.
3. All manual modifications made by the YGK member to the draft table must be logged for audit purposes.

---

## 4. ÖİDB Staff Use Cases

### UC-19: ÖİDB retrieve the documents
**Actor:** ÖİDB
**Description:** ÖİDB accesses the system and retrieve application
**Priority:** High | **Frequency:** Once for each application
**Metadata:** Created by Emin Kılıçaslan (14.11.2025), Updated by Emin Kılıçaslan (15.11.2025)

**Preconditions:**
* PRE-1. ÖİDB staff logged in to web UI.
* PRE-2. Student Affairs processed and forwarded the applications.
* PRE-3. At least one application has been submitted.

**Postconditions:**
* POST-1. ÖİDB has accessed the applications and related documents.
* POST-2. ÖİDB staff is ready to review the applications.
* POST-3. Application documents to be forwarded to the next organizational unit in the order.

**Normal Course of Events:**
1. ÖİDB staff presses button to list applications
2. System lists the applicant students along with their application documents

**Exceptions:**
* 1.EX.1. The home page fails to load.
* 2.EX.1. ÖİDB Staff isn’t given access by database manager to view applicant lists.
* 2.EX.2. Connection fails before the student list is loaded.

**Assumptions:**
1. Multiple users with the same role of ÖİDB staff shall not make edits on the applicant list for synchronization purposes.
2. Database admin has given sufficient permission to ÖİDB staff.

---

### UC-20: Created and Announce the asil/yedek tables
**Actor:** ÖİDB, Secretariat
**Description:** Asil/yedek tables were created and announced
**Priority:** High | **Frequency:** 1/year
**Metadata:** Created by Ali Alp Haraç (13.11.2025)

**Preconditions:**
* PRE-1. All necessary calculations must have been made

**Postconditions:**
* POST-1. Asil/yedek tables are uploaded to the site for applicants to view.

**Normal Course of Events:**
1. The candidate's horizontal transfer score is calculated based on the following formula: (x/y*100*0,9)+(z*0,1)
2. In evaluating the applications of foreign nationals or candidates placed through the DGS exam, the base score for the year in which the student registered for the program they are enrolled is used as the ÖSYS/YKS score.
3. The list is created by ranking the candidates' horizontal transfer scores from highest to lowest.
4. Starting with the candidate with the highest score, a maximum of 10 candidates are selected based on the available quota. The remaining candidates are designated as reserve candidates.
5. The prepared asil/yedek table is uploaded to the system publicly.

**Includes:** 1. Transcripts and curriculum of the accomplished classes for the primary and waitlisted applicants forwarded to transfer committee (YGK)

---

### UC-27: Check Documents
**Actor:** OIDB Staff
**Description:** OIDB checks the documents or edits if necessary
**Priority:** Medium | **Frequency:** Once per application
**Metadata:** Created by Aykhan (13.11.2025)

**Preconditions:**
* PRE-1 OIDB Staff is logged in into the system
* PRE-2 OIDB Staff is on Retrieve Documents screen (UC-19)

**Postconditions:**
* POST-1 OIDB staff checked documents of individual

**Normal Course of Events:**
1. OIDB staff presses The Eye icon.
2. Application Details Screen pops up
3. OIDB Staff checks details
4. OIDB Staff makes changes.
5. OIDB Staff presses the button to save changes.

**Alternative Courses:**
* 4.AC.1 OIDB Staff does not make changes -> OIDB presses button to close Application details screen

**Exceptions:**
* 1.EX.1 System does not work

**Includes:** UC-19

---

## 5. YDYO Staff Use Cases

### UC-29: Receive application list
**Actor:** YDYO staff
**Description:** YDYO staff retrieves the application from the user interface.
**Priority:** High | **Frequency:** Once for all applications and once for eligible applications per year.
**Metadata:** Created by Aykhan Aliyev (09.05.2026)

**Preconditions:**
* PRE-1. YDYO staff have logged into the system with proper credentials.
* PRE-2. YDYO staff has reached the home page of web UI
* PRE-3. The YDYO staff possesses permission to review applications.
* PRE-4. At least one application was submitted to the faculty.

**Postconditions:**
* POST-1. The YDYO staff obtains all the applications for that faculty.

**Normal Course of Events:**
1. YDYO staff presses the button to list applications.
2. YDYO staff reviews the loaded list and moves forward use case (UC-30).

**Exceptions:**
* 1.EX.1 Server is down
* 1.EX.2 Internet connection cuts before retrieving the lists.

**Includes:** UC-30

---

### UC-30: Mark English Prep Status and Forward
**Actor:** YDYO staff
**Description:** YDYO staff reviews and marks applicants english prep status
**Priority:** Medium | **Frequency:** Once for all applications and once for eligible applications per year.
**Metadata:** Created by Aykhan Aliyev (09.05.2026)

**Preconditions:**
* PRE-1 YDYO staff has logged in into the system
* PRE-1 YDYO staff has received documents (UC-29)
* PRE-2 YDYO staff is connected to the system

**Postconditions:**
* POST-1 Applicants are marked based on their English proficiency status.

**Normal Course of Events:**
1. YDYO staff presses on the application from the list.
2. Application details are shown.
3. YDYO Staff sets applicant status from dropdown menu
4. YDYO staff presses button to save and forward

**Exceptions:**
* 4.EX.1 Applicant status could not be saved (Connection issue) -> 1. Error message - “Connection Error”

**Includes:** UC-29

---

## 6. General Staff Use Cases

### UC-32: Log In for Dean’s Office Staff
**Actor:** Staff
**Description:** User logs into the system.
**Priority:** High | **Frequency:** 2000/year
**Metadata:** Created by Enes Kaya (23.11.2025), Updated by Aykhan Aliyev (09.05.2026)

**Preconditions:**
* PRE-1. User has entered the interface of the login step.
* PRE-2. User should have already registered in the system.

**Postconditions:**
* POST-1 User entered to the home page of the system.

**Normal Course of Events:**
1. User enters the university email and password.
2. User presses to the ‘Login’ button.
3. System checks whether email and password matches.
4. User access to the home page.

**Alternative Courses:**
* 3.AC.1. The email and password are not matched. -> 1. User is notified with a pop up that says: ‘Email or password doesn’t match.’ 2. User is redirected to the login page.

