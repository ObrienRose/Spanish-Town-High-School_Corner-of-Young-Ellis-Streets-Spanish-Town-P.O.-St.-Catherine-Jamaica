/*
    Institution: University of Technology, Jamaica
    CIT2011 Web Programming Group Assignment
    Project: Spanish Town High School Portal
    Username: teacher | Password: teacher123

    Group Member Information:
    Student 1: Obrien Rose | 2509101 | Tuesday 03:00 PM - 05:00 PM
    Student 2: Soyibo Grant | 2301323 | Tuesday 03:00 PM - 05:00 PM
    Student 3: Colissa Gentles | 2501993 | Tuesday 03:00 PM - 05:00 PM
    Student 4: Alex Fairman | 2508755 | Tuesday 03:00 PM - 05:00 PM
*/

// This is the same storage key used by the administrator page.
const teacherDatabaseKey = "schoolPortaldb";

// Read the shared student, subject and grade records.
function loadTeacherDatabase() {
    let savedDatabase = null;

    try {
        savedDatabase = JSON.parse(localStorage.getItem(teacherDatabaseKey));
    } catch (error) {
        savedDatabase = null;
    }

    if (!savedDatabase) {
        savedDatabase = {
            students: [],
            subjects: [],
            grades: []
        };
    }

    if (!Array.isArray(savedDatabase.students)) {
        savedDatabase.students = [];
    }

    if (!Array.isArray(savedDatabase.subjects)) {
        savedDatabase.subjects = [];
    }

    if (!Array.isArray(savedDatabase.grades)) {
        savedDatabase.grades = [];
    }

    return savedDatabase;
}

let teacherDatabase = loadTeacherDatabase();

// Save any grade updates to the shared school database.
function saveTeacherDatabase() {
    localStorage.setItem(
        teacherDatabaseKey,
        JSON.stringify(teacherDatabase)
    );
}

// Get the student's full name.
function getStudentName(student) {
    return [student.firstName, student.lastName]
        .filter(Boolean)
        .join(" ");
}

// Show a message below the teacher sections.
function showTeacherMessage(message, isError) {
    let messageBox = document.getElementById("teacherMessage");

    messageBox.textContent = message;
    messageBox.classList.toggle("is-error", Boolean(isError));
}

// Fill a select menu with a first choice and the supplied options.
function fillTeacherSelect(select, firstLabel, values) {
    select.replaceChildren();
    select.add(new Option(firstLabel, ""));
    values.forEach(function(value) {
        select.add(new Option(value, value));
    });
}

// Fill the cohort menu using cohorts that have students.
function populateCohortMenu() {
    let cohortSelect = document.getElementById("teacherCohortSelect");
    let cohorts = Array.from(new Set(teacherDatabase.students.map(function(student) {
        return student.semester;
    }).filter(Boolean)));

    fillTeacherSelect(cohortSelect, cohorts.length ? "Choose cohort" : "No cohorts available", cohorts);
}

// Fill the grade menu after a cohort has been selected.
function populateGradeMenu() {
    let cohort = document.getElementById("teacherCohortSelect").value;
    let gradeSelect = document.getElementById("teacherGradeSelect");
    let gradeOrder = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Sixth Form"];
    let grades = gradeOrder.filter(function(grade) {
        return teacherDatabase.students.some(function(student) {
            return student.semester === cohort && student.gradeLevel === grade;
        });
    });

    fillTeacherSelect(gradeSelect, "Choose grade", grades);
    gradeSelect.disabled = cohort === "" || grades.length === 0;
}

// Fill the subject menu after both class filters are chosen.
function populateSubjectMenu() {
    let subjectSelect = document.getElementById("subjectSelect");
    subjectSelect.replaceChildren(new Option(
        teacherDatabase.subjects.length ? "Choose subject" : "No subjects available",
        ""
    ));
    teacherDatabase.subjects.forEach(function(subject) {
        subjectSelect.add(new Option(subject.name, subject.id));
    });
    subjectSelect.disabled = !document.getElementById("teacherGradeSelect").value ||
        teacherDatabase.subjects.length === 0;
    updateLoadButton();
}

// Return only the class currently selected in the filter steps.
function getSelectedTeacherStudents() {
    let cohort = document.getElementById("teacherCohortSelect").value;
    let grade = document.getElementById("teacherGradeSelect").value;
    return teacherDatabase.students.filter(function(student) {
        return (!cohort || student.semester === cohort) &&
            (!grade || student.gradeLevel === grade);
    });
}

// Enable loading only after each filter step has been completed.
function updateLoadButton() {
    let ready = document.getElementById("teacherCohortSelect").value !== "" &&
        document.getElementById("teacherGradeSelect").value !== "" &&
        document.getElementById("subjectSelect").value !== "";
    document.getElementById("loadStudentsButton").disabled = !ready;
}

// Update totals for the selected class and subject.
function updateStatistics() {
    let students = getSelectedTeacherStudents();
    let studentIds = students.map(function(student) {
        return student.studentId;
    });
    let subjectId = document.getElementById("subjectSelect").value;
    let grades = teacherDatabase.grades.filter(function(grade) {
        return studentIds.includes(grade.studentId) &&
            (!subjectId || grade.subjectId === subjectId);
    });

    document.getElementById("totalStudents").textContent =
        students.length;

    document.getElementById("totalGrades").textContent =
        grades.length;

    let average = 0;

    if (grades.length > 0) {
        let total = grades.reduce(function(sum, grade) {
            return sum + Number(grade.score);
        }, 0);

        average = (total / grades.length).toFixed(1);
    }

    document.getElementById("classAverage").textContent = average + "%";
}

// Add a cell to a table row.
function addTableCell(row, text) {
    let cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
    return cell;
}

// Load only the students that match the selected cohort, grade and subject.
function loadStudents() {
    let cohort = document.getElementById("teacherCohortSelect").value;
    let grade = document.getElementById("teacherGradeSelect").value;
    let subjectId = document.getElementById("subjectSelect").value;
    let studentTable = document.getElementById("studentTable");
    let matchingStudents = getSelectedTeacherStudents();

    studentTable.replaceChildren();

    if (cohort === "" || grade === "" || subjectId === "") {
        showTeacherMessage("Complete the cohort, grade and subject steps first.", true);
        return;
    }

    if (matchingStudents.length === 0) {
        let row = studentTable.insertRow();
        let cell = row.insertCell();
        cell.colSpan = 3;
        cell.textContent = "No students match this grade and cohort.";
        showTeacherMessage("Check the selected grade and cohort.", false);
        return;
    }

    matchingStudents.forEach(function(student) {
        let row = studentTable.insertRow();
        let studentId = student.studentId;
        let studentName = getStudentName(student);

        addTableCell(row, studentId);
        addTableCell(row, studentName);

        let scoreCell = row.insertCell();
        let scoreInput = document.createElement("input");
        let savedGrade = teacherDatabase.grades.find(function(grade) {
            return grade.studentId === studentId &&
                grade.subjectId === subjectId;
        });

        scoreInput.type = "number";
        scoreInput.id = "teacher-score-" + studentId + "-" + subjectId;
        scoreInput.name = "scores[" + studentId + "][" + subjectId + "]";
        scoreInput.autocomplete = "off";
        scoreInput.min = "0";
        scoreInput.max = "100";
        scoreInput.step = "0.1";
        scoreInput.className = "teacher-grade-input";
        scoreInput.dataset.studentId = studentId;
        scoreInput.value = savedGrade ? savedGrade.score : "";
        scoreInput.setAttribute(
            "aria-label",
            "Score for " + studentName
        );

        scoreCell.appendChild(scoreInput);
    });

    updateStatistics();
    showTeacherMessage(matchingStudents.length + " matching students loaded. Enter scores, then select Save Grades.", false);
}

// Save the scores entered for the selected subject.
function saveGrades() {
    let subjectId = document.getElementById("subjectSelect").value;
    let scoreInputs = document.querySelectorAll("#studentTable .teacher-grade-input");

    if (subjectId === "" || document.getElementById("teacherCohortSelect").value === "" ||
        document.getElementById("teacherGradeSelect").value === "") {
        showTeacherMessage("Complete the cohort, grade and subject steps first.", true);
        return;
    }

    if (scoreInputs.length === 0) {
        showTeacherMessage("Load the students before saving grades.", true);
        return;
    }

    for (let input of scoreInputs) {
        if (input.value !== "" && !input.checkValidity()) {
            input.focus();
            showTeacherMessage("Scores must be between 0 and 100.", true);
            return;
        }
    }

    let savedCount = 0;

    scoreInputs.forEach(function(input) {
        if (input.value === "") {
            return;
        }

        let studentId = input.dataset.studentId;
        let score = Number(input.value);
        let existingGrade = teacherDatabase.grades.find(function(grade) {
            return grade.studentId === studentId &&
                grade.subjectId === subjectId;
        });

        if (existingGrade) {
            existingGrade.score = score;
        } else {
            teacherDatabase.grades.push({
                studentId: studentId,
                subjectId: subjectId,
                score: score
            });
        }

        savedCount++;
    });

    if (savedCount === 0) {
        showTeacherMessage("Enter at least one score before saving.", true);
        return;
    }

    saveTeacherDatabase();
    updateStatistics();
    showTeacherMessage(savedCount + " grades saved.", false);
}

// Change a score into a letter grade.
function calculateLetterGrade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    if (score >= 50) return "E";

    return "F";
}

// Make one row for the report card table.
function addReportRow(tableBody, subject, score) {
    let row = tableBody.insertRow();

    addTableCell(row, subject);
    addTableCell(row, score + "%");
    addTableCell(row, calculateLetterGrade(score));
}

// Create a report card from the shared grade records.
function generateReportCard() {
    let studentId = document.getElementById("reportStudentID").value.trim();
    let reportCard = document.getElementById("reportCard");

    reportCard.replaceChildren();

    if (studentId === "") {
        reportCard.textContent = "Enter a student ID to create a report.";
        showTeacherMessage("Enter a student ID first.", true);
        return;
    }

    let student = teacherDatabase.students.find(function(record) {
        return record.studentId.toLowerCase() === studentId.toLowerCase();
    });

    if (!student) {
        reportCard.textContent = "No student record was found for that ID.";
        showTeacherMessage("Check the student ID and try again.", true);
        return;
    }

    let studentGrades = teacherDatabase.grades.filter(function(grade) {
        return grade.studentId === student.studentId;
    });

    if (studentGrades.length === 0) {
        reportCard.textContent = "No grades have been saved for this student.";
        showTeacherMessage("There are no grades to include yet.", false);
        return;
    }

    let reportHeading = document.createElement("h3");
    reportHeading.textContent = "Student Report Card";
    reportCard.appendChild(reportHeading);

    let nameLine = document.createElement("p");
    nameLine.textContent = "Student Name: " + getStudentName(student);
    reportCard.appendChild(nameLine);

    let idLine = document.createElement("p");
    idLine.textContent = "Student ID: " + student.studentId;
    reportCard.appendChild(idLine);

    let table = document.createElement("table");
    table.className = "data-table teacher-report-table";
    let caption = document.createElement("caption");
    caption.textContent = "Grades by subject";
    table.appendChild(caption);

    let tableHead = table.createTHead();
    let headingRow = tableHead.insertRow();

    ["Subject", "Score", "Grade"].forEach(function(heading) {
        let cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = heading;
        headingRow.appendChild(cell);
    });

    let tableBody = table.createTBody();
    let total = 0;

    studentGrades.forEach(function(grade) {
        let subject = teacherDatabase.subjects.find(function(record) {
            return record.id === grade.subjectId;
        });

        let subjectName = subject ? subject.name : "Subject";
        let score = Number(grade.score);

        total += score;
        addReportRow(tableBody, subjectName, score);
    });

    reportCard.appendChild(table);

    let average = total / studentGrades.length;
    let averageLine = document.createElement("p");
    averageLine.textContent = "Overall Average: " + average.toFixed(1) + "%";
    reportCard.appendChild(averageLine);

    let statusLine = document.createElement("p");
    statusLine.textContent = "Overall Status: " +
        (average >= 50 ? "PASS" : "FAIL");
    reportCard.appendChild(statusLine);

    let subjectCount = document.createElement("p");
    subjectCount.textContent = "Total Subjects: " + studentGrades.length;
    reportCard.appendChild(subjectCount);

    showTeacherMessage("Report card created.", false);
}

// Show the selected teacher section.
function showTeacherTab(panelId) {
    document.querySelectorAll(".teacher-panel").forEach(function(panel) {
        panel.hidden = panel.id !== panelId;
    });

    document.querySelectorAll(".teacher-tab").forEach(function(tab) {
        let isActive = tab.dataset.tab === panelId;

        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
    });
}

// Set up the teacher page controls.
document.addEventListener("DOMContentLoaded", function() {
    let currentSession = typeof getCurrentSession === "function"
        ? getCurrentSession()
        : null;

    if (!currentSession) {
        window.location.href = "login.html";
        return;
    }

    if (typeof requireRole === "function" && !requireRole("teacher")) {
        return;
    }

    populateCohortMenu();
    document.getElementById("teacherGradeSelect").disabled = true;
    document.getElementById("subjectSelect").disabled = true;
    updateStatistics();

    document.querySelectorAll(".teacher-tab").forEach(function(tab) {
        tab.addEventListener("click", function() {
            showTeacherTab(tab.dataset.tab);
        });
    });

    document.getElementById("loadStudentsButton").addEventListener(
        "click",
        loadStudents
    );

    document.getElementById("teacherCohortSelect").addEventListener("change", function() {
        populateGradeMenu();
        document.getElementById("subjectSelect").replaceChildren(new Option("Choose subject", ""));
        document.getElementById("subjectSelect").disabled = true;
        document.getElementById("studentTable").replaceChildren();
        updateLoadButton();
        updateStatistics();
    });

    document.getElementById("teacherGradeSelect").addEventListener("change", function() {
        populateSubjectMenu();
        document.getElementById("studentTable").replaceChildren();
        updateStatistics();
    });

    document.getElementById("subjectSelect").addEventListener("change", function() {
        updateLoadButton();
        document.getElementById("studentTable").replaceChildren();
        updateStatistics();
    });

    document.getElementById("saveGradesButton").addEventListener(
        "click",
        saveGrades
    );

    document.getElementById("generateReportButton").addEventListener(
        "click",
        generateReportCard
    );

    document.getElementById("logout-button").addEventListener("click", function() {
        if (typeof logoutUser === "function") {
            logoutUser();
        }
    });
});
