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

    if (authData.expired == true) {
        // Remove items from local storage
        localStorage.removeItem("activities");
        localStorage.removeItem("goals");
        localStorage.removeItem("scheduled_activities");
        localStorage.removeItem("running_activity");
        localStorage.setItem("current_activity", -1);
    }
}

checkAuthAndRedirect();