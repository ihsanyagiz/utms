# Engineering Standards & Coding Principles

## 1. Core Philosophy
Write professional, maintainable, and highly readable Python code. The codebase must be easy for human engineers to edit, scale, and debug. Optimize for readability over cleverness.

## 2. Mandatory Programming Principles
You must strictly adhere to the following principles when implementing any logic for this system:

* **DRY (Don't Repeat Yourself):** * Never duplicate code. 
    * If multiple classes (e.g., `DeanOffice` and `YGK`) require similar functionality (like retrieving a filtered list of applicants), extract this into a shared interface or a base class method. 
* **SRP (Single Responsibility Principle):**
    * A function or class should have only one reason to change.
    * **Routes** only handle HTTP requests, input validation, and returning responses.
    * **Classes/Models** only handle core business logic and state.
    * **Database Interfaces** only handle data persistence and retrieval.
* **KISS (Keep It Simple, Stupid) & YAGNI (You Aren't Gonna Need It):**
    * Do not over-engineer. We are using an Agile methodology. Build the simplest mechanism that satisfies the current Phase requirements. Do not add speculative features or complex design patterns unless explicitly requested.
* **Fail-Fast & Defensive Programming:**
    * Validate inputs at the route level before passing them to the business logic.
    * Use try-except blocks for all database operations and external calls, raising clear, custom exceptions.

## 3. Method Flexibility & Interface Rules
* **Autonomy to Add Methods:** You are permitted (and encouraged) to add helper methods, getter/setter methods, or private methods to classes if they improve code clarity and encapsulate logic properly.
* **Use of Interfaces (Abstractions):** If you detect that multiple classes share behaviors, implement Python Abstract Base Classes (`abc.ABC`). 
    * *Example:* If `Oidb`, `Dean`, and `Ydyo` all need a way to verify documents, create an `IDocumentReviewer` interface that these classes inherit from.
* **Dependency Injection:** Do not hardcode database connections inside class methods. Pass the `DatabaseInterface` instance into the classes that need it.

## 4. Type Hinting and Documentation
* Use strict Python type hints (PEP 484) for all function arguments and return types. 
* Write Google-style docstrings for every class and public method explaining *what* it does, the arguments, and the return value.