/*
    Institution: University of Technology, Jamaica
    CIT2011 Web Programming Group Assignment
    Project: Spanish Town High School Portal

    Group Member Information:
    Student 1: Obrien Rose | 2509101 | Tuesday 03:00 PM - 05:00 PM
    Student 2: Soyibo Grant | 2301323 | Tuesday 03:00 PM - 05:00 PM
    Student 3: Colissa Gentles | 2501993 | Tuesday 03:00 PM - 05:00 PM
    Student 4: Alex Fairman | 2508755 | Tuesday 03:00 PM - 05:00 PM 
*/

// Database storage key
const Database_key = "schoolPortaldb";

// Create the database if it is missing, then add any new fields.
function initializeDataBase() {
    const initialDatabase = {
        users: [
            { id: 1, username: "admin", password: "admin123", role: "administrator" },
            { id: 2, username: "teacher", password: "teacher123", role: "teacher" },
            { id: 3, username: "viewer", password: "viewer123", role: "viewer" }
        ],
        students: [],
        subjects: [],
        grades: [],
        payments: [],
        tuitionFees: []
    };

    let database = null;

    try {
        const savedData = localStorage.getItem(Database_key);
        database = savedData ? JSON.parse(savedData) : null;
    } catch (error) {
        database = null;
    }

    if (!database || typeof database !== "object" || Array.isArray(database)) {
        database = initialDatabase;
    }

    ["users", "students", "subjects", "grades", "payments", "tuitionFees"]
        .forEach(function (listName) {
            if (!Array.isArray(database[listName])) {
                database[listName] = [];
            }
        });

    // Add the viewer login to databases that were already saved.
    const viewerExists = database.users.some(function (user) {
        return user.role === "viewer";
    });

    if (!viewerExists) {
        const largestId = database.users.reduce(function (largest, user) {
            return Math.max(largest, Number(user.id) || 0);
        }, 0);

        database.users.push({
            id: largestId + 1,
            username: "viewer",
            password: "viewer123",
            role: "viewer"
        });
    }

    localStorage.setItem(Database_key, JSON.stringify(database));
}

// Gather database records

function getDatabase(){
    const database = localStorage.getItem(Database_key);
    return database ? JSON.parse(database):null;
}

// Getrieving updated database record

function getUsers() {
    const database = getDatabase();

    return database && Array.isArray(database.users) ? database.users : [];
}

// Save database

function saveDatabase(database) {
    if (!database || typeof database !== "object") {
        return;
    }

    localStorage.setItem(Database_key, JSON.stringify(database));
}

// Initialize the database when the website loads up

initializeDataBase();
