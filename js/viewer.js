/*
    Institution: University of Technology, Jamaica
    CIT2011 Web Programming Group Assignment
    Project: Spanish Town High School Portal
    Username: viewer | Password: viewer123

    Group Member Information:
    Student 1: Obrien Rose | 2509101 | Tuesday 03:00 PM - 05:00 PM
    Student 2: Soyibo Grant | 2301323 | Tuesday 03:00 PM - 05:00 PM
    Student 3: Colissa Gentles | 2501993 | Tuesday 03:00 PM - 05:00 PM
    Student 4: Alex Fairman | 2508755 | Tuesday 03:00 PM - 05:00 PM 
*/

document.addEventListener("DOMContentLoaded", function () {
    // Only viewers can use this page.
    if (typeof requireRole !== "function" || !requireRole("viewer")) {
        return;
    }

    // Get the search controls and result areas.
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const searchButton = document.getElementById("searchButton");

    const studentRecords = document.getElementById("studentRecords");
    const gradeRecords = document.getElementById("gradeRecords");
    const paymentRecords = document.getElementById("paymentRecords");

    const reportFilter = document.getElementById("reportFilter");
    const generateReportButton = document.getElementById("generateReport");
    const reportOutput = document.getElementById("reportOutput");

    // Read the saved records and make sure each list is an array.
    function loadRecords() {
        let savedData = {};

        try {
            if (typeof getDatabase === "function") {
                savedData = getDatabase() || {};
            }
        } catch (error) {
            savedData = {};
        }

        return {
            students: Array.isArray(savedData.students) ? savedData.students : [],
            subjects: Array.isArray(savedData.subjects) ? savedData.subjects : [],
            grades: Array.isArray(savedData.grades) ? savedData.grades : [],
            payments: Array.isArray(savedData.payments) ? savedData.payments : [],
            tuitionFees: Array.isArray(savedData.tuitionFees) ? savedData.tuitionFees : []
        };
    }

    // Get a student's name from the fields in the database.
    function getStudentName(student) {
        if (student.name) {
            return student.name;
        }

        const fullName = [student.firstName, student.lastName]
            .filter(Boolean)
            .join(" ");

        return fullName || "Name unavailable";
    }

    // Get the student's ID even if an older record uses a different field.
    function getStudentId(student) {
        return student.studentId || student.id || "N/A";
    }

    // Show a message when there are no matching records.
    function showEmptyMessage(container, message) {
        const paragraph = document.createElement("p");
        paragraph.className = "empty-message";
        paragraph.textContent = message;
        container.replaceChildren(paragraph);
    }

    // Make a card for one record.
    function createRecordCard(title, details) {
        const card = document.createElement("article");
        card.className = "record-card";

        const heading = document.createElement("h3");
        heading.textContent = title;
        card.appendChild(heading);

        details.forEach(function (detail) {
            const paragraph = document.createElement("p");
            paragraph.textContent = detail;
            card.appendChild(paragraph);
        });

        return card;
    }

    // Show student profiles.
    function displayStudents(records) {
        studentRecords.replaceChildren();

        if (records.length === 0) {
            showEmptyMessage(studentRecords, "No student profiles match this search.");
            return;
        }

        records.forEach(function (student) {
            const card = createRecordCard(getStudentName(student), [
                "Student ID: " + getStudentId(student),
                "Date of birth: " + (student.dateOfBirth || "N/A"),
                "Gender: " + (student.gender || "N/A"),
                "Grade: " + (student.gradeLevel || student.class || "N/A"),
                "Cohort: " + (student.semester || "N/A"),
                "Guardian: " + (student.guardianName || "N/A"),
                "Guardian phone: " + (student.guardianPhone || "N/A")
            ]);

            studentRecords.appendChild(card);
        });
    }

    // Find a subject's name using its saved subject ID.
    function getSubjectName(grade, database) {
        const subject = database.subjects.find(function (item) {
            return item.id === grade.subjectId;
        });

        return subject ? subject.name : (grade.subjectId || "N/A");
    }

    // Show academic records.
    function displayGrades(records, database) {
        gradeRecords.replaceChildren();

        if (records.length === 0) {
            showEmptyMessage(gradeRecords, "No academic records match this search.");
            return;
        }

        records.forEach(function (grade) {
            const student = database.students.find(function (item) {
                return String(item.studentId) === String(grade.studentId);
            });
            const studentLabel = student
                ? getStudentName(student) + " (" + getStudentId(student) + ")"
                : "Student ID: " + (grade.studentId || "N/A");
            const card = createRecordCard(studentLabel, [
                "Subject: " + getSubjectName(grade, database),
                "Score: " + (grade.score ?? grade.grade ?? "N/A")
            ]);

            gradeRecords.appendChild(card);
        });
    }

    // Format an amount as Jamaican dollars.
    function formatAmount(amount) {
        if (amount === null || amount === undefined) {
            return "Not set";
        }

        return "J$" + Number(amount).toFixed(2);
    }

    // Work out each student's tuition balance and payment status.
    function getFinancialRecords(database) {
        return database.students.map(function (student) {
            const studentPayments = database.payments.filter(function (payment) {
                return String(payment.studentId) === String(getStudentId(student)) &&
                    (!payment.semester || payment.semester === student.semester);
            });

            const tuitionFee = database.tuitionFees.find(function (fee) {
                return String(fee.studentId) === String(getStudentId(student)) &&
                    fee.semester === student.semester;
            });

            const paidCents = studentPayments.reduce(function (total, payment) {
                return total + Math.round(Number(payment.amount || 0) * 100);
            }, 0);
            const paidAmount = paidCents / 100;

            const tuition = tuitionFee ? Number(tuitionFee.amount) : null;
            const balance = tuition === null
                ? null
                : Math.max(0, Math.round((tuition - paidAmount) * 100) / 100);

            let status = "Not set";

            if (tuition !== null) {
                if (balance === 0) {
                    status = "Paid";
                } else if (paidAmount > 0) {
                    status = "Pending";
                } else {
                    status = "Outstanding";
                }
            }

            return {
                student: student,
                payments: studentPayments,
                tuition: tuition,
                paidAmount: paidAmount,
                balance: balance,
                status: status
            };
        });
    }

    // Show each student's financial statement.
    function displayPayments(records) {
        paymentRecords.replaceChildren();

        if (records.length === 0) {
            showEmptyMessage(paymentRecords, "No financial statements match this search.");
            return;
        }

        records.forEach(function (record) {
            const student = record.student;
            const transactions = record.payments.map(function (payment) {
                const date = payment.paymentDate || "Date not recorded";
                const reference = payment.reference ? " | Receipt: " + payment.reference : "";
                return "Payment: " + formatAmount(payment.amount) +
                    " | Date: " + date + reference;
            });

            if (transactions.length === 0) {
                transactions.push("No payments recorded.");
            }

            const card = createRecordCard(
                getStudentName(student) + " (" + getStudentId(student) + ")",
                [
                    "Tuition: " + formatAmount(record.tuition),
                    "Payments received: " + formatAmount(record.paidAmount),
                    "Balance: " + formatAmount(record.balance),
                    "Status: " + record.status
                ].concat(transactions)
            );

            paymentRecords.appendChild(card);
        });
    }

    // Check whether the search text appears in these values.
    function matchesSearch(searchText, values) {
        const searchableText = values
            .filter(function (value) {
                return value !== null && value !== undefined;
            })
            .join(" ")
            .toLowerCase();

        return searchableText.includes(searchText);
    }

    // Search the selected type of records.
    function searchRecords() {
        const database = loadRecords();
        const searchText = searchInput.value.trim().toLowerCase();
        const category = categoryFilter.value;
        const financialRecords = getFinancialRecords(database);

        const matchingStudents = database.students.filter(function (student) {
            return matchesSearch(searchText, [
                getStudentName(student),
                student.studentId,
                student.id,
                student.gradeLevel,
                student.semester
            ]);
        });

        const matchingGrades = database.grades.filter(function (grade) {
            const student = database.students.find(function (item) {
                return item.studentId === grade.studentId;
            });

            return matchesSearch(searchText, [
                grade.studentId,
                student ? getStudentName(student) : "",
                getSubjectName(grade, database),
                grade.score,
                grade.grade
            ]);
        });

        const matchingPayments = financialRecords.filter(function (record) {
            const student = record.student;
            const references = record.payments.map(function (payment) {
                return payment.reference;
            });

            return matchesSearch(searchText, [
                getStudentName(student),
                getStudentId(student),
                student.gradeLevel,
                student.semester,
                record.status,
                record.tuition,
                record.paidAmount,
                record.balance
            ].concat(references));
        });

        displayStudents(
            category === "all" || category === "students" ? matchingStudents : []
        );
        displayGrades(
            category === "all" || category === "grades" ? matchingGrades : [],
            database
        );
        displayPayments(
            category === "all" || category === "payments" ? matchingPayments : []
        );
    }

    // Create a report using the selected payment status.
    function createReport() {
        const database = loadRecords();
        const selectedStatus = reportFilter.value;
        let financialRecords = getFinancialRecords(database);

        if (selectedStatus !== "all") {
            financialRecords = financialRecords.filter(function (record) {
                return record.status.toLowerCase() === selectedStatus;
            });
        }

        reportOutput.replaceChildren();

        const heading = document.createElement("h3");
        heading.textContent = "Financial Report";
        reportOutput.appendChild(heading);

        const total = document.createElement("p");
        total.textContent = "Students in report: " + financialRecords.length;
        reportOutput.appendChild(total);

        if (financialRecords.length === 0) {
            const message = document.createElement("p");
            message.textContent = "No financial records match this filter.";
            reportOutput.appendChild(message);
            return;
        }

        financialRecords.forEach(function (record) {
            const student = record.student;
            const paragraph = document.createElement("p");

            paragraph.textContent =
                getStudentName(student) +
                " (" + getStudentId(student) + ")" +
                " | Tuition: " + formatAmount(record.tuition) +
                " | Paid: " + formatAmount(record.paidAmount) +
                " | Status: " + record.status +
                " | Balance: " + formatAmount(record.balance);

            reportOutput.appendChild(paragraph);
        });
    }

    // Run a search when the button is clicked or Enter is pressed.
    searchButton.addEventListener("click", searchRecords);

    searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            searchRecords();
        }
    });

    // Make a report when the report button is clicked.
    generateReportButton.addEventListener("click", createReport);

    // Show all records when the dashboard opens.
    searchRecords();
});
