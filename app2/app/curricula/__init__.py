"""Curricula package — one module per department."""

from .computer_engineering import COMPUTER_ENGINEERING_CURRICULUM

CURRICULA: dict[str, list[dict]] = {
    "computer_engineering": COMPUTER_ENGINEERING_CURRICULUM,
}

# Maps ApplicationORM.target_program → department key
PROGRAM_DEPARTMENT_MAP: dict[str, str] = {
    "Computer Engineering": "computer_engineering",
    "Software Engineering": "computer_engineering",
}


def get_department_for_program(target_program: str) -> str | None:
    """Return the YGK department key for a given target program, or None."""
    return PROGRAM_DEPARTMENT_MAP.get(target_program)


def get_curriculum(department: str) -> list[dict]:
    """Return the curriculum course list for a department key."""
    return CURRICULA.get(department, [])
