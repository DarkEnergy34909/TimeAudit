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

async function checkAuth() {
    const authResponse = await fetch("/api/auth", {
        method: "GET",
        headers: {
            "X-Requested-With": "XMLHttpRequest", // Indicate that this is an AJAX request
        },
    })

    const authData = await authResponse.json();

    console.log("Authenticated: " + authData.authenticated);

    return authData.authenticated;
}

// Function to sync localStorage with server-side state
async function syncLocalStorageToServer() {
    const authResult = await checkAuth();

    if (authResult) {
        // User has been authenticated

        // Get activities from local storage
        const activitiesString = localStorage.getItem("activities");

        if (activitiesString) {
            const syncResponse = await fetch("/api/activities/sync", {
                method: "POST",
                body: activitiesString,
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
            })

            const syncData = await syncResponse.json();

            if (syncResponse.ok && syncData.success) {
                //alert("Sync successful");
            }
            else {
                //alert("Sync failed");
            }
        }

        // Get goals from local storage
        const goalsString = localStorage.getItem("goals");

        if (goalsString) {
            const syncResponse = await fetch("/api/goals/sync", {
                method: "POST",
                body: goalsString,
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
            })

            const syncData = await syncResponse.json();

            if (syncResponse.ok && syncData.success) {
                //alert("Sync successful");
            }
            else {
                //alert("Sync failed");
            }
        }
    }
    else {
        //alert("NOT AUTHENTICATED");
    }
}

function activitiesOverlap(activity1, activity2) {
    if (activity1.date != activity2.date || activity2.startTime > activity1.endTime || activity1.startTime > activity2.endTime) {
        return false;
    }
    else {
        return true;
    }
}

async function pullActivitiesFromServer() {
    // For now, if any activities overlap between local storage and the server, prioritise the server

    // Get activities from the server
    const activitiesResponse = await fetch("/api/activities", {
        method: "GET",
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })

    const activitiesData = await activitiesResponse.json();

    if (activitiesResponse.ok && activitiesData) {
        // Overwrite local storage (ok because sync was already performed)
        localStorage.setItem("activities", JSON.stringify(activitiesData));
    }
}

async function pullGoalsFromServer() {
    // Get goals from server
    const goalsResponse = await fetch("/api/goals", {
        method: "GET",
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })

    const goalsData = await goalsResponse.json();

    if (goalsResponse.ok && goalsData) {
        // Overwrite local storage
        localStorage.setItem("goals", JSON.stringify(goalsData));
    }
}

document.getElementById("login-form").onsubmit = async function(event) {
    // Prevent default form submission
    event.preventDefault(); 

    // Get form data (event.target refers to the form)
    const formData = new FormData(event.target);

    const response = await fetch("/login", {
        method: "POST",
        body: formData, 
        headers: {
            "X-Requested-With": "XMLHttpRequest", // Indicate that this is an AJAX request
        },
        credentials: 'include'
    })

    const data = await response.json();

    if (response.ok && data.token) {
        // Sync activities with server
        await syncLocalStorageToServer();

        // Pull goals from server
        await pullGoalsFromServer();

        // Pull activities from server
        await pullActivitiesFromServer();

        // Redirect to calendar page
        window.location.href = "/calendar";
    }
    else {
        // Go to the login page again
        //window.location.href = "/login";

        // Handle errors
        if (data.error == "empty_email_or_password") {
            // TODO
        }
        else if (data.error == "incorrect_email_or_password") {
            // Show error message for incorrect email or password
            errorMessage = document.getElementById("incorrect-login-error");
            errorMessage.hidden = false;
        }
        else if (data.error == "server_error") {
            // Show generic error message
            errorMessage = document.getElementById("generic-login-error");
            errorMessage.hidden = false;
        }
        else {
            // Show generic error message
            errorMessage = document.getElementById("generic-login-error");
            errorMessage.hidden = false;
        }
    }
}

checkAuthAndRedirect();