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

// User Role
const dashboardRoutes = {

    administrator: "admin-dashboard.html",
    teacher: "teacher-dashboard.html",
    viewer: "viewer-dashboard.html"
};

// User authenticator function
function authenticate_User(username, password){
    
    // Gather registered users
    const users = getUsers();

    // Check for match
    const user = users.find(function(account){
        
        return account.username === username && account.password === password;
    });

    // Show matching user or no user
    return user || null;
}

// Session creater for user login
function create_Session(user){
    const session = {
        token: crypto.randomUUID(),

        userId: user.id,
        username:user.username,
        role: user.role,
        loginTime: new Date().toISOString()
    };

    // Log session in session storage
    sessionStorage.setItem(
        "schoolPortalSession",
        JSON.stringify(session)
    );

    return session;
}

// Retrieve current session
function getCurrentSession(){
    const session = sessionStorage.getItem("schoolPortalSession");

    return session ? JSON.parse(session) : null;
}

// Check user clearance
function requireRole(requiredRole){

    // Use of scope
    const session = getCurrentSession();

    // Check if user loggen in
    if(!session){
        window.location.href = "login.html";
        return false;
    }

    // Check user role
    if (session.role !== requiredRole){
        
        window.location.href = dashboardRoutes[session.role] || "login.html";
        return false;
    }
    
    return true;
}

// Log out user
function logoutUser(){
    
    // Exit session
    sessionStorage.removeItem("schoolPortalSession");

    // Go back to login page
    window.location.href = "login.html";
}

// Handling for log in
document.addEventListener("DOMContentLoaded", function(){

    const loginForm = document.getElementById("loginForm");

    const errorMessage = document.getElementById("errorMessage");
    const passwordInput = document.getElementById("password");
    const passwordToggle = document.getElementById("togglePassword");

    // This shows or hides the password when the button is clicked.
    if (passwordInput && passwordToggle) {
        passwordToggle.addEventListener("click", function(){
            const passwordIsVisible = passwordInput.type === "text";

            passwordInput.type = passwordIsVisible ? "password" : "text";
            passwordToggle.textContent = passwordIsVisible ? "Show" : "Hide";
            passwordToggle.setAttribute(
                "aria-label",
                passwordIsVisible ? "Show password" : "Hide password"
            );
            passwordToggle.setAttribute("aria-pressed", String(!passwordIsVisible));
        });
    }

    // Stop if log in form is not on page
    if (!loginForm){
        return;
    }

    loginForm.addEventListener("submit", function(event){

        // Prevent form refreshing page 
        event.preventDefault();

        // Retrieve credentials.
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        // Check credentials
        const user = authenticate_User(username, password);

        if (user){

            create_Session(user);

            window.location.href=dashboardRoutes[user.role];
        }else{
            errorMessage.textContent= "Invalid username or password. Give it another try...";
        }
    });
});
