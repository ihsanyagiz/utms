"""Faculty and program reference data."""

PROGRAMS_BY_FACULTY = {
    "Faculty of Science": [
        "Physics",
        "Photonics",
        "Chemistry",
        "Mathematics",
        "Molecular Biology and Genetics",
    ],
    "Faculty of Engineering": [
        "Computer Engineering",
        "Bioengineering",
        "Environmental Engineering",
        "Energy Systems Engineering",
        "Electrical-Electronics Engineering",
        "Food Engineering",
        "Civil Engineering",
        "Chemical Engineering",
        "Mechanical Engineering",
        "Materials Science and Engineering",
    ],
    "Faculty of Architecture": [
        "Industrial Design",
        "Architecture",
        "City and Regional Planning",
    ],
}

AVAILABLE_PROGRAMS = [prog for progs in PROGRAMS_BY_FACULTY.values() for prog in progs]
