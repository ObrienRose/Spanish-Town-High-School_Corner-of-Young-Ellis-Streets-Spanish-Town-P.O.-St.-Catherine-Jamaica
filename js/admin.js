/*
    Institution: University of Technology, Jamaica
    CIT2011 Web Programming Group Assignment
    Project: Spanish Town High School Portal
    Username: admin | Password: admin123

    Group Member Information:
    Student 1: Obrien Rose | 2509101 | Tuesday 03:00 PM - 05:00 PM
    Student 2: Soyibo Grant | 2301323 | Tuesday 03:00 PM - 05:00 PM
    Student 3: Colissa Gentles | 2501993 | Tuesday 03:00 PM - 05:00 PM
    Student 4: Alex Fairman | 2508755 | Tuesday 03:00 PM - 05:00 PM
*/


// 1. SHARED VALUES AND DATABASE HELPERS

// Same storage key that Student 2 uses in database.js.
const adminStorageKey = "schoolPortaldb";

// Options used by the form dropdowns.
const adminGradeLevels = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Sixth Form"];
const adminSemesters = ["2026/2027 Semester 1", "2026/2027 Semester 2"];
const adminDefaultSubjects = [
    "Mathematics", "English Language", "Integrated Science",
    "Social Studies", "Visual and Performing Arts", "Physical Education"
];

// Holds the whole database in memory while the page is open.
let adminDatabase = null;

// Holds the student ID being edited (null when registering a new student).
let adminEditingId = null;

// Reads the database from localStorage and makes sure every array exists.
function loadAdminDatabase() {
    let storedDatabase = null;

    try {
        storedDatabase = JSON.parse(localStorage.getItem(adminStorageKey));
    } catch (error) {
        storedDatabase = null;
    }

    if (!storedDatabase) {
        storedDatabase = { users: [], students: [], subjects: [], grades: [], payments: [], tuitionFees: [] };
    }

    ["students", "subjects", "grades", "payments", "tuitionFees"].forEach(function (arrayName) {
        if (!Array.isArray(storedDatabase[arrayName])) {
            storedDatabase[arrayName] = [];
        }
    });

    // Rename previously saved Information Technology records.
    const informationTechnologySubject = storedDatabase.subjects.find(function (subject) {
        return subject.name === "Information Technology";
    });

    if (informationTechnologySubject) {
        let visualArtsSubject = storedDatabase.subjects.find(function (subject) {
            return subject.name === "Visual and Performing Arts";
        });

        if (!visualArtsSubject) {
            informationTechnologySubject.name = "Visual and Performing Arts";
            visualArtsSubject = informationTechnologySubject;
        } else {
            storedDatabase.grades.forEach(function (grade) {
                if (grade.subjectId === informationTechnologySubject.id) {
                    grade.subjectId = visualArtsSubject.id;
                }
            });
            storedDatabase.subjects = storedDatabase.subjects.filter(function (subject) {
                return subject.id !== informationTechnologySubject.id;
            });
        }
    }

    // Adds the starting subjects the first time the dashboard runs.
    if (storedDatabase.subjects.length === 0) {
        adminDefaultSubjects.forEach(function (subjectName, index) {
            storedDatabase.subjects.push({
                id: "SUB-" + String(index + 1).padStart(3, "0"),
                name: subjectName
            });
        });
    }

    return storedDatabase;
}

// Saves the in-memory database back to localStorage.
function saveAdminDatabase() {
    localStorage.setItem(adminStorageKey, JSON.stringify(adminDatabase));
}

// Creates the next student ID, for example STU-004.
function createStudentId() {
    let highestNumber = 0;

    adminDatabase.students.forEach(function (student) {
        const number = parseInt(student.studentId.replace("STU-", ""), 10);
        if (number > highestNumber) {
            highestNumber = number;
        }
    });

    return "STU-" + String(highestNumber + 1).padStart(3, "0");
}

// Fills a dropdown with options. Adds a first option if a label is given.
function fillSelect(selectElement, optionValues, firstOptionLabel) {
    selectElement.replaceChildren();

    if (firstOptionLabel) {
        selectElement.add(new Option(firstOptionLabel, ""));
    }

    optionValues.forEach(function (value) {
        selectElement.add(new Option(value, value));
    });
}

// Adds a text cell to a table row (textContent keeps typed text safe).
function addTableCell(row, text) {
    const cell = row.insertCell();
    cell.textContent = text;
    return cell;
}

// Creates a small button for a table row.
function createRowButton(label, extraClass, clickHandler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "row-button " + extraClass;
    button.textContent = label;
    button.addEventListener("click", clickHandler);
    return button;
}

// Shows a success or error message in a feedback paragraph.
function showAdminMessage(element, message, isError) {
    element.textContent = message;
    element.classList.toggle("error", isError);
    element.classList.toggle("success", !isError);
}


// 2. STUDENT REGISTRY

// Draws the student table using the search box and cohort filter.
function renderStudentTable() {
    const tableBody = document.getElementById("student-table-body");
    const selectedSemester = document.getElementById("filter-semester").value;
    const searchText = document.getElementById("student-search").value.trim().toLowerCase();

    tableBody.replaceChildren();

    const matchingStudents = adminDatabase.students.filter(function (student) {
        const fullText = (student.studentId + " " + student.firstName + " " + student.lastName).toLowerCase();
        const semesterMatches = selectedSemester === "" || student.semester === selectedSemester;
        return semesterMatches && fullText.includes(searchText);
    });

    if (matchingStudents.length === 0) {
        const emptyCell = tableBody.insertRow().insertCell();
        emptyCell.colSpan = 6;
        emptyCell.className = "empty-row";
        emptyCell.textContent = "No students found. Register a student above.";
    }

    matchingStudents.forEach(function (student) {
        const row = tableBody.insertRow();
        addTableCell(row, student.studentId);
        addTableCell(row, student.firstName + " " + student.lastName);
        addTableCell(row, student.gradeLevel);
        addTableCell(row, student.semester);
        addTableCell(row, student.guardianName + " (" + student.guardianPhone + ")");

        const actionCell = row.insertCell();
        actionCell.appendChild(createRowButton("Edit", "", function () {
            startEditingStudent(student.studentId);
        }));
        actionCell.appendChild(createRowButton("Delete", "is-danger", function () {
            deleteStudent(student.studentId);
        }));
    });

    document.getElementById("student-count").textContent =
        matchingStudents.length + " of " + adminDatabase.students.length + " students shown";
}

// Clears the form and returns it to "register" mode.
function resetStudentForm() {
    const studentForm = document.getElementById("student-form");

    studentForm.reset();
    studentForm.classList.remove("was-validated");
    adminEditingId = null;

    document.getElementById("student-form-title").textContent = "Register a student";
    document.getElementById("student-save-button").textContent = "Register student";
    document.getElementById("student-cancel-button").hidden = true;
}

// Copies a student's details into the form so they can be updated.
function startEditingStudent(studentId) {
    const student = adminDatabase.students.find(function (item) {
        return item.studentId === studentId;
    });

    if (!student) {
        return;
    }

    adminEditingId = studentId;

    document.getElementById("first-name").value = student.firstName;
    document.getElementById("last-name").value = student.lastName;
    document.getElementById("date-of-birth").value = student.dateOfBirth;
    document.getElementById("gender").value = student.gender;
    document.getElementById("grade-level").value = student.gradeLevel;
    document.getElementById("semester").value = student.semester;
    document.getElementById("guardian-name").value = student.guardianName;
    document.getElementById("guardian-phone").value = student.guardianPhone;

    document.getElementById("student-form-title").textContent = "Update " + student.studentId;
    document.getElementById("student-save-button").textContent = "Save changes";
    document.getElementById("student-cancel-button").hidden = false;
    document.getElementById("student-form").scrollIntoView({ behavior: "smooth" });
}

// Deletes a student and the grades and payments linked to them.
function deleteStudent(studentId) {
    if (!confirm("Delete " + studentId + " and all of their grades and payments?")) {
        return;
    }

    adminDatabase.students = adminDatabase.students.filter(function (student) {
        return student.studentId !== studentId;
    });
    adminDatabase.grades = adminDatabase.grades.filter(function (grade) {
        return grade.studentId !== studentId;
    });
    adminDatabase.payments = adminDatabase.payments.filter(function (payment) {
        return payment.studentId !== studentId;
    });
    adminDatabase.tuitionFees = adminDatabase.tuitionFees.filter(function (fee) {
        return fee.studentId !== studentId;
    });

    saveAdminDatabase();
    populateLedgerStudentMenus();
    renderFinancialLedger();
    renderStudentTable();
    renderGradeMatrix();
    showAdminMessage(document.getElementById("student-feedback"), studentId + " was deleted.", false);
}

// Validates the form, then adds a new student or updates the one being edited.
function handleStudentSubmit(event) {
    event.preventDefault();

    const studentForm = document.getElementById("student-form");
    const feedback = document.getElementById("student-feedback");

    studentForm.classList.add("was-validated");

    if (!studentForm.checkValidity()) {
        studentForm.reportValidity();
        showAdminMessage(feedback, "Fix the highlighted fields and try again.", true);
        return;
    }

    const studentDetails = {
        firstName: document.getElementById("first-name").value.trim(),
        lastName: document.getElementById("last-name").value.trim(),
        dateOfBirth: document.getElementById("date-of-birth").value,
        gender: document.getElementById("gender").value,
        gradeLevel: document.getElementById("grade-level").value,
        semester: document.getElementById("semester").value,
        guardianName: document.getElementById("guardian-name").value.trim(),
        guardianPhone: document.getElementById("guardian-phone").value.trim()
    };

    // A birth date in the future is not valid.
    if (new Date(studentDetails.dateOfBirth) > new Date()) {
        showAdminMessage(feedback, "Date of birth cannot be in the future.", true);
        return;
    }

    // Stops the same student being registered twice.
    const isDuplicate = adminDatabase.students.some(function (student) {
        return student.studentId !== adminEditingId &&
            student.firstName.toLowerCase() === studentDetails.firstName.toLowerCase() &&
            student.lastName.toLowerCase() === studentDetails.lastName.toLowerCase() &&
            student.dateOfBirth === studentDetails.dateOfBirth;
    });

    if (isDuplicate) {
        showAdminMessage(feedback, "A student with this name and date of birth already exists.", true);
        return;
    }

    if (adminEditingId) {
        const existingStudent = adminDatabase.students.find(function (student) {
            return student.studentId === adminEditingId;
        });
        Object.assign(existingStudent, studentDetails);
        showAdminMessage(feedback, adminEditingId + " was updated.", false);
    } else {
        const newStudent = Object.assign({ studentId: createStudentId() }, studentDetails);
        adminDatabase.students.push(newStudent);
        showAdminMessage(feedback, newStudent.studentId + " was registered.", false);
    }

    saveAdminDatabase();
    populateLedgerStudentMenus();
    renderFinancialLedger();
    resetStudentForm();
    renderStudentTable();
    renderGradeMatrix();
}


// 3. ACADEMIC MATRIX

// Finds the saved score for one student and subject (or null).
function findGrade(studentId, subjectId) {
    return adminDatabase.grades.find(function (grade) {
        return grade.studentId === studentId && grade.subjectId === subjectId;
    }) || null;
}

// Works out the average of the filled-in score boxes in one row.
function updateRowAverage(row) {
    const scoreInputs = row.querySelectorAll(".matrix-input");
    let total = 0;
    let count = 0;

    scoreInputs.forEach(function (input) {
        if (input.value !== "" && input.checkValidity()) {
            total += Number(input.value);
            count++;
        }
    });

    row.querySelector(".matrix-average").textContent = count > 0 ? (total / count).toFixed(1) : "-";
}

// Draws the grade grid: one row per student, one column per subject.
function renderGradeMatrix() {
    const matrixTable = document.getElementById("matrix-table");
    const selectedSemester = document.getElementById("matrix-semester").value;

    matrixTable.replaceChildren();

    // Header row.
    const headerRow = matrixTable.createTHead().insertRow();
    ["ID", "Student"].concat(adminDatabase.subjects.map(function (subject) {
        return subject.name;
    })).concat(["Average"]).forEach(function (title) {
        const headerCell = document.createElement("th");
        headerCell.scope = "col";
        headerCell.textContent = title;
        headerRow.appendChild(headerCell);
    });

    const matrixBody = matrixTable.createTBody();
    const cohortStudents = adminDatabase.students.filter(function (student) {
        return selectedSemester === "" || student.semester === selectedSemester;
    });

    if (cohortStudents.length === 0) {
        const emptyCell = matrixBody.insertRow().insertCell();
        emptyCell.colSpan = adminDatabase.subjects.length + 3;
        emptyCell.className = "empty-row";
        emptyCell.textContent = "No students in this cohort yet.";
        return;
    }

    cohortStudents.forEach(function (student) {
        const row = matrixBody.insertRow();
        addTableCell(row, student.studentId);
        addTableCell(row, student.firstName + " " + student.lastName);

        adminDatabase.subjects.forEach(function (subject) {
            const savedGrade = findGrade(student.studentId, subject.id);
            const scoreInput = document.createElement("input");

            scoreInput.type = "number";
            scoreInput.id = "matrix-score-" + student.studentId + "-" + subject.id;
            scoreInput.name = "grades[" + student.studentId + "][" + subject.id + "]";
            scoreInput.autocomplete = "off";
            scoreInput.className = "matrix-input";
            scoreInput.min = "0";
            scoreInput.max = "100";
            scoreInput.step = "0.1";
            scoreInput.value = savedGrade ? savedGrade.score : "";
            scoreInput.dataset.studentId = student.studentId;
            scoreInput.dataset.subjectId = subject.id;
            scoreInput.setAttribute("aria-label", student.firstName + " " + student.lastName + " " + subject.name);

            row.insertCell().appendChild(scoreInput);
        });

        addTableCell(row, "-").className = "matrix-average";
        updateRowAverage(row);
    });
}

// Saves every score in the grid to the database.
function saveGradeMatrix() {
    const feedback = document.getElementById("matrix-feedback");
    const scoreInputs = document.querySelectorAll("#matrix-table .matrix-input");
    let savedCount = 0;

    // Rejects the whole save if any score is outside 0 to 100.
    for (const input of scoreInputs) {
        if (!input.checkValidity()) {
            input.focus();
            showAdminMessage(feedback, "Scores must be between 0 and 100.", true);
            return;
        }
    }

    scoreInputs.forEach(function (input) {
        const studentId = input.dataset.studentId;
        const subjectId = input.dataset.subjectId;
        const existingGrade = findGrade(studentId, subjectId);

        if (input.value === "") {
            // An empty box removes the saved score.
            adminDatabase.grades = adminDatabase.grades.filter(function (grade) {
                return grade !== existingGrade;
            });
        } else if (existingGrade) {
            existingGrade.score = Number(input.value);
            savedCount++;
        } else {
            adminDatabase.grades.push({ studentId: studentId, subjectId: subjectId, score: Number(input.value) });
            savedCount++;
        }
    });

    saveAdminDatabase();
    showAdminMessage(feedback, savedCount + " scores saved.", false);
}


// 4. FINANCIAL LEDGER

// Formats ledger amounts as Jamaican dollars.
function formatLedgerAmount(amount) {
    return "J$" + Number(amount || 0).toFixed(2);
}

// Uses the visitor's local date for the payment date field.
function getLocalDateValue() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}

// Fills the student menus used to set tuition and record payments.
function populateLedgerStudentMenus() {
    ["tuition-student", "payment-student"].forEach(function (selectId) {
        const select = document.getElementById(selectId);
        const previousStudentId = select.value;
        const hasStudents = adminDatabase.students.length > 0;
        const placeholder = hasStudents ? "Select a student" : "Register a student first";

        select.replaceChildren(new Option(placeholder, ""));

        adminDatabase.students.forEach(function (student) {
            const fullName = student.firstName + " " + student.lastName;
            select.add(new Option(fullName + " (" + student.studentId + ")", student.studentId));
        });

        select.disabled = !hasStudents;

        if (adminDatabase.students.some(function (student) {
            return student.studentId === previousStudentId;
        })) {
            select.value = previousStudentId;
        }
    });
}

// Gets the fee and all payments that belong to this student and cohort.
function getStudentLedger(student) {
    const fee = adminDatabase.tuitionFees.find(function (item) {
        return item.studentId === student.studentId && item.semester === student.semester;
    });
    const payments = adminDatabase.payments.filter(function (payment) {
        return payment.studentId === student.studentId &&
            (!payment.semester || payment.semester === student.semester);
    });
    const paidInCents = payments.reduce(function (total, payment) {
        return total + Math.round(Number(payment.amount || 0) * 100);
    }, 0);
    const totalPaid = paidInCents / 100;
    const tuition = fee ? Number(fee.amount) : null;
    const balance = tuition === null ? null : Math.max(0, Math.round((tuition - totalPaid) * 100) / 100);

    let status = "Not set";
    if (tuition !== null) {
        if (balance === 0) {
            status = "Paid";
        } else if (totalPaid > 0) {
            status = "Pending";
        } else {
            status = "Outstanding";
        }
    }

    return { tuition: tuition, totalPaid: totalPaid, balance: balance, status: status };
}

// Shows each student's tuition, payments, balance and payment status.
function renderFinancialLedger() {
    const ledgerBody = document.getElementById("ledger-table-body");
    const transactionBody = document.getElementById("transaction-table-body");
    let totalTuition = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    ledgerBody.replaceChildren();
    transactionBody.replaceChildren();

    if (adminDatabase.students.length === 0) {
        const emptyRow = ledgerBody.insertRow();
        const emptyCell = emptyRow.insertCell();
        emptyCell.colSpan = 6;
        emptyCell.className = "empty-row";
        emptyCell.textContent = "Register students before adding tuition or payments.";
    }

    adminDatabase.students.forEach(function (student) {
        const ledger = getStudentLedger(student);
        if (ledger.tuition !== null) {
            totalTuition += ledger.tuition;
            totalPaid += ledger.totalPaid;
            totalBalance += ledger.balance;
        }

        const row = ledgerBody.insertRow();
        addTableCell(row, student.firstName + " " + student.lastName + " (" + student.studentId + ")");
        addTableCell(row, student.gradeLevel + ", " + student.semester);
        addTableCell(row, ledger.tuition === null ? "Set tuition" : formatLedgerAmount(ledger.tuition));
        addTableCell(row, formatLedgerAmount(ledger.totalPaid));
        addTableCell(row, ledger.balance === null ? "Not available" : formatLedgerAmount(ledger.balance));

        const statusCell = addTableCell(row, ledger.status);
        statusCell.className = "ledger-status ledger-status-" + ledger.status.toLowerCase().replace(/\s+/g, "-");
    });

    document.getElementById("ledger-total-tuition").textContent = formatLedgerAmount(totalTuition);
    document.getElementById("ledger-total-paid").textContent = formatLedgerAmount(totalPaid);
    document.getElementById("ledger-total-balance").textContent = formatLedgerAmount(totalBalance);

    const sortedPayments = adminDatabase.payments.slice().sort(function (first, second) {
        return String(second.paymentDate || "").localeCompare(String(first.paymentDate || ""));
    });

    if (sortedPayments.length === 0) {
        const emptyRow = transactionBody.insertRow();
        const emptyCell = emptyRow.insertCell();
        emptyCell.colSpan = 4;
        emptyCell.className = "empty-row";
        emptyCell.textContent = "No payments have been recorded.";
    }

    sortedPayments.forEach(function (payment) {
        const student = adminDatabase.students.find(function (item) {
            return item.studentId === payment.studentId;
        });
        const row = transactionBody.insertRow();
        addTableCell(row, payment.paymentDate || "Date not recorded");
        addTableCell(row, student ? student.firstName + " " + student.lastName + " (" + student.studentId + ")" : payment.studentId);
        addTableCell(row, payment.reference || "-");
        addTableCell(row, formatLedgerAmount(payment.amount));
    });
}

// Saves the verified tuition amount for one student's cohort.
function handleTuitionSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = document.getElementById("tuition-feedback");
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const studentId = document.getElementById("tuition-student").value;
    const amount = Number(document.getElementById("tuition-amount").value);
    const student = adminDatabase.students.find(function (item) {
        return item.studentId === studentId;
    });
    if (!student || amount <= 0) {
        showAdminMessage(feedback, "Choose a student and enter a valid tuition amount.", true);
        return;
    }

    if (amount < getStudentLedger(student).totalPaid) {
        showAdminMessage(feedback, "The tuition amount cannot be lower than payments already recorded.", true);
        return;
    }

    let fee = adminDatabase.tuitionFees.find(function (item) {
        return item.studentId === studentId && item.semester === student.semester;
    });
    if (fee) {
        fee.amount = amount;
        fee.updatedAt = new Date().toISOString();
    } else {
        adminDatabase.tuitionFees.push({
            studentId: studentId,
            semester: student.semester,
            amount: amount,
            updatedAt: new Date().toISOString()
        });
    }

    saveAdminDatabase();
    renderFinancialLedger();
    showAdminMessage(feedback, "Tuition amount saved.", false);
}

// Saves an individual payment and prevents paying more than the balance.
function handlePaymentSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = document.getElementById("payment-feedback");
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const studentId = document.getElementById("payment-student").value;
    const amount = Number(document.getElementById("payment-amount").value);
    const student = adminDatabase.students.find(function (item) {
        return item.studentId === studentId;
    });
    if (!student || amount <= 0) {
        showAdminMessage(feedback, "Choose a student and enter a valid payment amount.", true);
        return;
    }

    const ledger = getStudentLedger(student);
    if (ledger.tuition === null) {
        showAdminMessage(feedback, "Set this student's tuition before recording a payment.", true);
        return;
    }
    if (amount > ledger.balance) {
        showAdminMessage(feedback, "The payment cannot be greater than the student's balance.", true);
        return;
    }

    adminDatabase.payments.push({
        id: "PAY-" + Date.now(),
        studentId: studentId,
        semester: student.semester,
        amount: amount,
        paymentDate: document.getElementById("payment-date").value,
        reference: document.getElementById("payment-reference").value.trim()
    });

    saveAdminDatabase();
    renderFinancialLedger();
    form.reset();
    document.getElementById("payment-date").value = getLocalDateValue();
    showAdminMessage(feedback, "Payment saved to the project ledger.", false);
}


// 5. TABS AND PAGE SET-UP

// Shows one dashboard panel and highlights its tab.
function showAdminTab(panelId) {
    document.querySelectorAll(".admin-panel").forEach(function (panel) {
        panel.hidden = panel.id !== panelId;
    });

    document.querySelectorAll(".admin-tab").forEach(function (tab) {
        const isActive = tab.dataset.tab === panelId;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
    });
}

// Runs once when the page has loaded.
document.addEventListener("DOMContentLoaded", function () {

    // Student 2's role check. Only an administrator may stay on this page.
    if (typeof requireRole === "function" && !requireRole("administrator")) {
        return;
    }

    adminDatabase = loadAdminDatabase();
    saveAdminDatabase();

    // Fills every dropdown.
    fillSelect(document.getElementById("grade-level"), adminGradeLevels, "Select grade level");
    fillSelect(document.getElementById("semester"), adminSemesters, "Select semester");
    fillSelect(document.getElementById("filter-semester"), adminSemesters, "All cohorts");
    fillSelect(document.getElementById("matrix-semester"), adminSemesters, "All cohorts");
    populateLedgerStudentMenus();
    document.getElementById("payment-date").value = getLocalDateValue();

    // Connects the buttons and inputs.
    document.getElementById("student-form").addEventListener("submit", handleStudentSubmit);
    document.getElementById("student-cancel-button").addEventListener("click", resetStudentForm);
    document.getElementById("student-search").addEventListener("input", renderStudentTable);
    document.getElementById("filter-semester").addEventListener("change", renderStudentTable);
    document.getElementById("matrix-semester").addEventListener("change", renderGradeMatrix);
    document.getElementById("matrix-save-button").addEventListener("click", saveGradeMatrix);
    document.getElementById("tuition-form").addEventListener("submit", handleTuitionSubmit);
    document.getElementById("payment-form").addEventListener("submit", handlePaymentSubmit);
    document.getElementById("tuition-student").addEventListener("change", function () {
        const student = adminDatabase.students.find(function (item) {
            return item.studentId === this.value;
        }, this);
        const fee = student && adminDatabase.tuitionFees.find(function (item) {
            return item.studentId === student.studentId && item.semester === student.semester;
        });
        document.getElementById("tuition-amount").value = fee ? fee.amount : "";
    });

    // Updates a row's average while scores are typed.
    document.getElementById("matrix-table").addEventListener("input", function (event) {
        if (event.target.classList.contains("matrix-input")) {
            updateRowAverage(event.target.closest("tr"));
        }
    });

    document.querySelectorAll(".admin-tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
            showAdminTab(tab.dataset.tab);
        });
    });

    // Student 2's logout function.
    document.getElementById("logout-button").addEventListener("click", function () {
        if (typeof logoutUser === "function") {
            logoutUser();
        }
    });

    renderStudentTable();
    renderGradeMatrix();
    renderFinancialLedger();
});
