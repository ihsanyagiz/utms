// UTMS Seed Data for IYTE UBYS Simulation

export const PROGRAMS = [
  "Computer Engineering",
  "Software Engineering",
  "Electrical-Electronics Engineering",
  "Mechanical Engineering"
];

export const SEMESTERS = [
  "2026-2027 Güz",
  "2026-2027 Bahar"
];

export const CURRICULA = {
  "computer_engineering": [
    { code: "MATH141", name: "Calculus I", credits: "4", akts: "5" },
    { code: "PHYS121", name: "General Physics I", credits: "4", akts: "7" },
    { code: "CENG111", name: "Concepts in Computer Engineering", credits: "3", akts: "5" },
    { code: "CENG113", name: "Programming Basics", credits: "4", akts: "6" },
    { code: "CENG115", name: "Discrete Structures", credits: "3", akts: "5" },
    { code: "ENG101",  name: "Development of Reading and Writing Skills I", credits: "3", akts: "3" },
    { code: "MATH142", name: "Calculus II", credits: "4", akts: "6" },
    { code: "PHYS122", name: "General Physics II", credits: "4", akts: "8" },
    { code: "MATH144", name: "Finite Mathematics", credits: "3", akts: "5" },
    { code: "CENG112", name: "Data Structures", credits: "3", akts: "5" },
    { code: "ECON106", name: "Principles of Economics", credits: "3", akts: "3" },
    { code: "ENG102",  name: "Development of Reading and Writing Skills II", credits: "3", akts: "3" },
    { code: "CENG211", name: "Programming Fundamentals", credits: "3", akts: "5" },
    { code: "CENG213", name: "Theory of Computation", credits: "3", akts: "5" },
    { code: "CENG215", name: "Circuits and Electronics", credits: "4", akts: "6" },
    { code: "MATH255", name: "Differential Equations", credits: "4", akts: "6" },
    { code: "HIST201", name: "Principles of Ataturk I", credits: "0", akts: "2" },
    { code: "TURK201", name: "Turkish Language I", credits: "0", akts: "2" },
    { code: "CENG212", name: "Concepts of Programming Languages", credits: "3", akts: "5" },
    { code: "CENG214", name: "Logic Design", credits: "4", akts: "6" },
    { code: "CENG216", name: "Numerical Computation", credits: "3", akts: "5" },
    { code: "CENG218", name: "Analysis and Design of Algorithms", credits: "3", akts: "5" },
    { code: "CENG222", name: "Probability and Statistics", credits: "3", akts: "5" },
    { code: "CENG311", name: "Computer Architecture", credits: "4", akts: "8" },
    { code: "CENG315", name: "Information Management", credits: "3", akts: "6" },
    { code: "CENG312", name: "Computer Networks", credits: "3", akts: "6" },
    { code: "CENG316", name: "Software Engineering", credits: "3", akts: "6" },
    { code: "CENG322", name: "Operating Systems", credits: "4", akts: "8" }
  ],
  "electrical_electronics_engineering": [
    { code: "MATH141", name: "Calculus I", credits: "4", akts: "5" },
    { code: "PHYS121", name: "General Physics I", credits: "4", akts: "7" },
    { code: "EE101", name: "Introduction to Electrical Engineering", credits: "3", akts: "5" },
    { code: "EE103", name: "Computer Tools for EE", credits: "3", akts: "5" },
    { code: "MATH142", name: "Calculus II", credits: "4", akts: "6" },
    { code: "PHYS122", name: "General Physics II", credits: "4", akts: "8" },
    { code: "EE201", name: "Circuit Theory I", credits: "4", akts: "6" },
    { code: "EE203", name: "Signals and Systems", credits: "3", akts: "5" },
    { code: "EE212", name: "Circuit Theory II", credits: "4", akts: "6" },
    { code: "EE214", name: "Electronic Circuits I", credits: "4", akts: "6" }
  ]
};

export const PROGRAM_DEPARTMENT_MAP = {
  "Computer Engineering": "computer_engineering",
  "Software Engineering": "computer_engineering",
  "Electrical-Electronics Engineering": "electrical_electronics_engineering",
  "Mechanical Engineering": "electrical_electronics_engineering" // mapped to simplify routing in seed
};

// Required documents: 1. Student Certificate, 2. Transcript, 3. OSYM Score
// Optional documents: 4. English Proficiency Certificate, 5. OSYM Certificate
export const DOCUMENT_SLOTS = [
  { id: 1, name: "Öğrenci Belgesi (Student Certificate)", required: true },
  { id: 2, name: "Not Dökümü (Transcript)", required: true },
  { id: 3, name: "ÖSYM Sonuç Belgesi (OSYM Score Report)", required: true },
  { id: 4, name: "İngilizce Muafiyet Belgesi (English Proficiency Certificate)", required: false },
  { id: 5, name: "ÖSYM Belgesi (OSYM Placement Certificate)", required: false }
];

export const INITIAL_USERS = [
  { id: 1, email: "admin@admin", role: "admin", department: null, fullName: "Sistem Yöneticisi" },
  { id: 2, email: "oidb@test", role: "oidb", department: null, fullName: "ÖİDB Memuru" },
  { id: 3, email: "dean@test", role: "dean", department: null, fullName: "Mühendislik Dekanı" },
  { id: 4, email: "ydyo@test", role: "ydyo", department: null, fullName: "YDYO Sorumlusu" },
  { id: 5, email: "ygk.ceng@test", role: "ygk", department: "computer_engineering", fullName: "Bilgisayar Müh. Komisyon Başkanı" },
  { id: 6, email: "ygk.elec@test", role: "ygk", department: "electrical_electronics_engineering", fullName: "EEM Müh. Komisyon Başkanı" }
];

// Seed 24 Applicants and their applications
const APPLICANT_SCENARIOS = [
  { id: 101, name: "Emre Yıldız", email: "emre.yildiz@test", status: "submitted", program: "Computer Engineering", gpa: "3.20", osym: "420.50", checkerStatus: "needs_manual_check", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: true, uni: "Boğaziçi University", idNumber: "12345678902" },
  { id: 102, name: "Selin Kaya", email: "selin.kaya@test", status: "submitted", program: "Electrical-Electronics Engineering", gpa: "3.55", osym: "430.00", checkerStatus: "needs_manual_check", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: true, uni: "Middle East Technical University", idNumber: "23456789012" },
  { id: 103, name: "Burak Demir", email: "burak.demir@test", status: "submitted", program: "Software Engineering", gpa: "1.80", osym: "310.00", checkerStatus: "auto_checked", checkerErrors: [{ type: "field", field: "current_gpa", reason: "GPA 1.80 is below the minimum required 2.00." }], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: true, uni: "Hacettepe University", idNumber: "34567890122" },
  { id: 104, name: "Fatma Arslan", email: "fatma.arslan@test", status: "submitted", program: "Computer Engineering", gpa: "2.90", osym: "385.40", checkerStatus: "auto_checked", checkerErrors: [{ type: "document", slot: 2, reason: "Transcript is missing." }, { type: "document", slot: 3, reason: "YKS Score Report is missing." }], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: false, uni: "Ankara University", idNumber: "45678901232" },
  { id: 105, name: "Mert Çelik", email: "mert.celik@test", status: "submitted", program: "Mechanical Engineering", gpa: "3.10", osym: "395.00", checkerStatus: "auto_checked", checkerErrors: [{ type: "field", field: "id_number", reason: "ID number must contain only digits." }, { type: "document", slot: 1, reason: "Student Certificate is missing." }], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: true, uni: "Ege University", idNumber: "5567890123A" },
  { id: 106, name: "Ayşe Şahin", email: "ayse.sahin@test", status: "submitted", program: "Computer Engineering", gpa: "3.40", osym: "420.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: true, uni: "Istanbul Technical University", idNumber: "65789012342" },
  { id: 107, name: "Hakan Öztürk", email: "hakan.ozturk@test", status: "forwarded_to_ydyo", program: "Software Engineering", gpa: "3.60", osym: "455.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: true, uni: "Koç University", idNumber: "76890123452" },
  { id: 108, name: "Zeynep Aydın", email: "zeynep.aydin@test", status: "forwarded_to_ydyo", program: "Computer Engineering", gpa: "2.95", osym: "360.00", checkerStatus: "auto_checked", checkerErrors: [{ type: "document", slot: 4, reason: "English proficiency certificate is missing." }], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: true, uni: "Sabancı University", idNumber: "87901234562" },
  { id: 109, name: "Onur Koç", email: "onur.koc@test", status: "forwarded_to_ydyo", program: "Electrical-Electronics Engineering", gpa: "3.75", osym: "470.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: false, uni: "Bilkent University", idNumber: "98012345672" },
  { id: 110, name: "Merve Doğan", email: "merve.dogan@test", status: "forwarded_to_dean", program: "Computer Engineering", gpa: "3.80", osym: "488.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: "eligible", enrolled: true, uni: "Yıldız Technical University", idNumber: "10987654322" },
  { id: 111, name: "Tolga Polat", email: "tolga.polat@test", status: "forwarded_to_dean", program: "Software Engineering", gpa: "3.25", osym: "410.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: "needs_test", enrolled: true, uni: "Boğaziçi University", idNumber: "21098765432" },
  { id: 112, name: "İrem Güneş", email: "irem.gunes@test", status: "forwarded_to_ygk", program: "Computer Engineering", gpa: "3.90", osym: "495.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: "eligible", enrolled: true, uni: "Middle East Technical University", idNumber: "32109876542" },
  { id: 113, name: "Berkay Erdoğan", email: "berkay.erdogan@test", status: "forwarded_to_ygk", program: "Software Engineering", gpa: "3.50", osym: "445.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: "eligible", enrolled: true, uni: "Hacettepe University", idNumber: "43210987652" },
  { id: 114, name: "Naz Yılmaz", email: "naz.yilmaz@test", status: "forwarded_to_ygk", program: "Computer Engineering", gpa: "3.65", osym: "460.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: "needs_test", enrolled: false, uni: "Ankara University", idNumber: "54321098762" },
  { id: 115, name: "Alper Tan", email: "alper.tan@test", status: "intibak_complete", program: "Computer Engineering", gpa: "3.70", osym: "472.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: "eligible", enrolled: true, uni: "Ege University", idNumber: "65432109872" },
  { id: 116, name: "Ceren Özdemir", email: "ceren.ozdemir@test", status: "intibak_complete", program: "Software Engineering", gpa: "3.85", osym: "491.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: "eligible", enrolled: true, uni: "Istanbul Technical University", idNumber: "76543210982" },
  { id: 117, name: "Yusuf Aktaş", email: "yusuf.aktas@test", status: "intibak_complete", program: "Computer Engineering", gpa: "3.45", osym: "438.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: "needs_test", enrolled: true, uni: "Koç University", idNumber: "87654321092" },
  { id: 118, name: "Gizem Sarı", email: "gizem.sari@test", status: "intibak_complete", program: "Computer Engineering", gpa: "4.00", osym: "510.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: "eligible", enrolled: true, uni: "Sabancı University", idNumber: "98765432102" },
  { id: 119, name: "Kaan Acar", email: "kaan.acar@test", status: "returned", program: "Computer Engineering", gpa: "2.50", osym: "320.00", checkerStatus: "needs_manual_check", checkerErrors: [], oidbNotes: "Official transcript is missing the notary stamp.", deanNotes: null, prepSchoolStatus: null, enrolled: true, uni: "Bilkent University", idNumber: "11223344552" },
  { id: 120, name: "Eda Bozkurt", email: "eda.bozkurt@test", status: "returned", program: "Mechanical Engineering", gpa: "3.05", osym: "388.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: "Student certificate must be issued within the last 6 months.", deanNotes: null, prepSchoolStatus: null, enrolled: false, uni: "Yıldız Technical University", idNumber: "22334455662" },
  { id: 121, name: "Canan Şen", email: "canan.sen@test", status: "returned", program: "Computer Engineering", gpa: "3.15", osym: "405.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: "Lise diploma copy is not certified.", prepSchoolStatus: "eligible", enrolled: true, uni: "Boğaziçi University", idNumber: "33445566772" },
  { id: 122, name: "Deniz Yıldırım", email: "deniz.yildirim@test", status: "cancelled", program: "Software Engineering", gpa: "3.35", osym: "415.00", checkerStatus: "auto_checked", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: true, uni: "Middle East Technical University", idNumber: "44556677882" },
  { id: 123, name: "Murat Güler", email: "murat.guler@test", status: "submitted", program: "Computer Engineering", gpa: "3.85", osym: "460.00", checkerStatus: "needs_manual_check", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: true, uni: "Hacettepe University", idNumber: "55667788992" },
  { id: 124, name: "Pınar Tekin", email: "pinar.tekin@test", status: "submitted", program: "Electrical-Electronics Engineering", gpa: "3.72", osym: "450.00", checkerStatus: "needs_manual_check", checkerErrors: [], oidbNotes: null, deanNotes: null, prepSchoolStatus: null, enrolled: true, uni: "Ankara University", idNumber: "66778899002" }
];

export const INITIAL_APPLICANT_USERS = APPLICANT_SCENARIOS.map(app => ({
  id: app.id,
  email: app.email,
  role: "applicant",
  department: null,
  fullName: app.name
}));

export const INITIAL_APPLICATIONS = APPLICANT_SCENARIOS.map(app => {
  // Generate dummy documents
  const docs = [
    { id: app.id * 10 + 1, slot: 1, filename: "ogrenci_belgesi.pdf", fileSize: "1.2 MB", uploadDate: "18.06.2026 14:22" },
    { id: app.id * 10 + 2, slot: 2, filename: "not_dokumu.pdf", fileSize: "2.4 MB", uploadDate: "18.06.2026 14:23" },
    { id: app.id * 10 + 3, slot: 3, filename: "osym_sonuc.pdf", fileSize: "850 KB", uploadDate: "18.06.2026 14:24" },
  ];
  
  if (app.prepSchoolStatus || app.status === "forwarded_to_ydyo" || app.status === "forwarded_to_dean" || app.status === "forwarded_to_ygk" || app.status === "intibak_complete") {
    docs.push({ id: app.id * 10 + 4, slot: 4, filename: "ingilizce_muafiyet.pdf", fileSize: "1.5 MB", uploadDate: "18.06.2026 14:25" });
  }

  // Calculate ranking score if intibak complete
  let rankingScore = null;
  if (app.status === "intibak_complete") {
    rankingScore = Number(((Number(app.osym) / 560) * 90 + (Number(app.gpa) / 4.0) * 10).toFixed(4));
  }

  return {
    id: app.id,
    applicantId: app.id,
    fullName: app.name,
    idNumber: app.idNumber,
    targetProgram: app.program,
    targetSemester: "2026-2027 Güz",
    currentGpa: app.gpa,
    sourceUniversity: app.uni,
    osymPoints: app.osym,
    isCurrentlyEnrolled: app.enrolled,
    status: app.status,
    docCheckerStatus: app.checkerStatus,
    docCheckerErrors: app.checkerErrors,
    oidbNotes: app.oidbNotes,
    deanNotes: app.deanNotes,
    prepSchoolStatus: app.prepSchoolStatus,
    forwardedFaculty: app.status === "forwarded_to_ygk" || app.status === "intibak_complete" ? PROGRAM_DEPARTMENT_MAP[app.program] : null,
    lastEditedById: 2, // Default edited by OIDB
    lastEditedAt: "18.06.2026 18:45",
    documents: docs,
    rankingScore: rankingScore
  };
});

// Seed some course matches for completed intibaks
export const INITIAL_INTIBAC_TABLES = [
  {
    applicationId: 115, // Alper Tan
    estimatedGpa: 3.65,
    rankingScore: 84.8071,
    courses: [
      { id: 1, sourceCode: "CS101", sourceName: "Intro to programming", sourceCredits: "4", sourceGrade: "AA", targetCode: "CENG113", targetName: "Programming Basics", status: "accepted" },
      { id: 2, sourceCode: "MATH101", sourceName: "Calculus I", sourceCredits: "5", sourceGrade: "BA", targetCode: "MATH141", targetName: "Calculus I", status: "accepted" },
      { id: 3, sourceCode: "PHYS101", sourceName: "Physics I", sourceCredits: "5", sourceGrade: "BB", targetCode: "PHYS121", targetName: "General Physics I", status: "accepted" }
    ]
  },
  {
    applicationId: 116, // Ceren Özdemir
    estimatedGpa: 3.82,
    rankingScore: 88.5134,
    courses: [
      { id: 4, sourceCode: "SENG102", sourceName: "Programming Basics", sourceCredits: "4", sourceGrade: "AA", targetCode: "CENG113", targetName: "Programming Basics", status: "accepted" },
      { id: 5, sourceCode: "MTH111", sourceName: "Calculus I", sourceCredits: "4", sourceGrade: "AA", targetCode: "MATH141", targetName: "Calculus I", status: "accepted" },
      { id: 6, sourceCode: "ENG101", sourceName: "English I", sourceCredits: "3", sourceGrade: "CB", targetCode: "ENG101", targetName: "Development of Reading and Writing Skills I", status: "accepted" }
    ]
  },
  {
    applicationId: 117, // Yusuf Aktaş
    estimatedGpa: 3.20,
    rankingScore: 78.9643,
    courses: [
      { id: 7, sourceCode: "COMP111", sourceName: "Python Programming", sourceCredits: "3", sourceGrade: "CC", targetCode: "CENG113", targetName: "Programming Basics", status: "accepted" },
      { id: 8, sourceCode: "MAT101", sourceName: "Calculus I", sourceCredits: "4", sourceGrade: "BB", targetCode: "MATH141", targetName: "Calculus I", status: "accepted" }
    ]
  },
  {
    applicationId: 118, // Gizem Sarı
    estimatedGpa: 4.00,
    rankingScore: 92.0000,
    courses: [
      { id: 9, sourceCode: "CENG101", sourceName: "Intro to CS", sourceCredits: "4", sourceGrade: "AA", targetCode: "CENG113", targetName: "Programming Basics", status: "accepted" },
      { id: 10, sourceCode: "MATH101", sourceName: "Calculus I", sourceCredits: "5", sourceGrade: "AA", targetCode: "MATH141", targetName: "Calculus I", status: "accepted" },
      { id: 11, sourceCode: "PHYS101", sourceName: "General Physics I", sourceCredits: "6", sourceGrade: "AA", targetCode: "PHYS121", targetName: "General Physics I", status: "accepted" },
      { id: 12, sourceCode: "ENG101", sourceName: "Academic English I", sourceCredits: "3", sourceGrade: "AA", targetCode: "ENG101", targetName: "Development of Reading and Writing Skills I", status: "accepted" }
    ]
  }
];
