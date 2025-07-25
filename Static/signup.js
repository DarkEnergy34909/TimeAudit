async function checkAuthAndRedirect() {
    const authResponse = await fetch("/api/auth", {
        method: "GET",
        headers: {
            "X-Requested-With": "XMLHttpRequest", // Indicate that this is an AJAX request
        },
    })

    const authData = await authResponse.json();

    console.log(authData.authenticated);

    if (authData.authenticated == true) {
        // Redirect to calendar page
        window.location.href = "/calendar"
    }
}

document.getElementById("signup-form").onsubmit = async function(event) {
    // Prevent default form submission
    event.preventDefault();

    // Get form data (event.target refers to the form)
    // In general, event.target is the form element that triggered the event
    const formData = new FormData(event.target);

    // Make POST request to the server
    const signupResponse = await fetch("/signup", {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest" // Indicate that this is an AJAX request
        },
        credentials: 'include'
    })

    const signupData = await signupResponse.json();
    
    if (signupResponse.ok && signupData.token) {
        // Store the token in localStorage
        //localStorage.setItem("token", data.token);

        // Make a POST request to the API to store all stored goals to the database
        const goalsString = localStorage.getItem("goals");
        if (goalsString) {

            // Send all goals to the server
            goalsResponse = await fetch("/api/goals", {
                method: "POST",
                body: goalsString,
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
            })

            const goalsData = await goalsResponse.json();
        }

        // Make a POST request to the API to store all stored activities to the database
        const activitiesString = localStorage.getItem("activities");
        console.log(activitiesString);
        if (activitiesString) {
            // Send all activities to the server
            activitiesResponse = await fetch("/api/activities", {
                method: "POST",
                body: activitiesString,
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
            })
            const activitiesData = await activitiesResponse.json();
        }

        // Make a POST request to the API to store all scheduled activities in the database
        const scheduledActivitiesString = localStorage.getItem("scheduled_activities");
        if (scheduledActivitiesString) {
            // Send all scheduled activities to the server
            scheduledActivitiesResponse = await fetch("/api/scheduled-activities", {
                method: "POST",
                body: scheduledActivitiesString,
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
            })
            const scheduledActivitiesData = await scheduledActivitiesResponse.json();
        }


        // Redirect to calendar page
        window.location.href = "/calendar";
    }
    else {
        // Handle errors
        if (signupData.error == "invalid_email_or_password") {
            // Show error message for invalid email or password
            document.getElementById("generic-signup-error").hidden = false;
        }

        else if (signupData.error == "invalid_email") {
            // Show error message for invalid email
            document.getElementById("generic-signup-error").hidden = false;
        }

        else if (signupData.error == "duplicate_email") {
            // Show error message for duplicate email
            document.getElementById("email-exists-error").hidden = false;
        }
        else if (signupData.error == "server_error") {
            // Show generic error message
            document.getElementById("generic-signup-error").hidden = false;
        }
        else {
            // Show generic error message
            document.getElementById("generic-signup-error").hidden = false;
        }
    }
}

checkAuth();