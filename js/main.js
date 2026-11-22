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

// 1. MOBILE NAVIGATION
// Gets the mobile navigation button and navigation menu.
const menuToggle = document.querySelector(".menu-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");

// Opens and closes the navigation menu when the button is clicked.
if (menuToggle && primaryNavigation) {

    menuToggle.addEventListener("click", function () {

        // Toggles the class that controls the mobile menu.
        const menuIsOpen = primaryNavigation.classList.toggle("is-open");

        // Updates the accessibility state of the button.
        menuToggle.setAttribute("aria-expanded", String(menuIsOpen));

        // Updates the accessible button description.
        menuToggle.setAttribute(
            "aria-label",
            menuIsOpen ? "Close navigation menu" : "Open navigation menu"
        );
    });

    // Closes the menu after a navigation link is selected.
    const navigationLinks = primaryNavigation.querySelectorAll("a");

    navigationLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            primaryNavigation.classList.remove("is-open");

            menuToggle.setAttribute("aria-expanded", "false");

            menuToggle.setAttribute("aria-label", "Open navigation menu");
        });
    });

    // Closes the menu when the browser returns to desktop width.
    window.addEventListener("resize", function () {

        if (window.innerWidth > 680) {

            primaryNavigation.classList.remove("is-open");

            menuToggle.setAttribute("aria-expanded", "false");
        }
    });
}


// 2. AUTOMATIC COPYRIGHT YEAR
// Finds the copyright year element in the footer.
const yearElement = document.querySelector("#current-year");

// Updates the year using the visitor's current calendar year.
if (yearElement) {

    yearElement.textContent = new Date().getFullYear();
}


// 3. CONTACT FORM ELEMENTS
// Gets the contact form and its feedback message element.
const contactForm = document.querySelector("#contact-form");
const formFeedback = document.querySelector("#form-feedback");

// Checks whether the contact form exists on the current page.
if (contactForm && formFeedback) {

    // Runs when a visitor submits the contact form.
    contactForm.addEventListener("submit", function (event) {

        // Stops the browser from reloading the page.
        event.preventDefault();

        // Checks the fields using the browser's built-in validation.
        if (!contactForm.checkValidity()) {

            contactForm.reportValidity();
            formFeedback.textContent = "Please complete each field correctly before submitting.";
            formFeedback.classList.remove("success");
            formFeedback.classList.add("error");

            return;
        }

        // Collects the values entered into the form.
        const formData = new FormData(contactForm);
        const enquiry = {
            id: "ENQ-" + Date.now(),
            fullName: String(formData.get("fullName")).trim(),
            email: String(formData.get("email")).trim(),
            subject: String(formData.get("subject")),
            message: String(formData.get("message")).trim(),
            submittedAt: new Date().toISOString()
        };

        // Saves the enquiry in the portal's browser storage.
        try {
            let schoolDatabase = JSON.parse(localStorage.getItem("schoolPortaldb")) || {};
            if (!schoolDatabase || typeof schoolDatabase !== "object" || Array.isArray(schoolDatabase)) {
                schoolDatabase = {};
            }
            if (!Array.isArray(schoolDatabase.enquiries)) {
                schoolDatabase.enquiries = [];
            }
            schoolDatabase.enquiries.push(enquiry);
            localStorage.setItem("schoolPortaldb", JSON.stringify(schoolDatabase));
        } catch (error) {
            formFeedback.textContent = "Your enquiry could not be saved. Please try again.";
            formFeedback.classList.remove("success");
            formFeedback.classList.add("error");
            return;
        }

        // Confirms that the enquiry was saved in this browser.
        formFeedback.textContent = "Thank you, " + enquiry.fullName + ". Your enquiry was saved successfully.";
        formFeedback.classList.remove("error");
        formFeedback.classList.add("success");
        contactForm.reset();
    });
}
