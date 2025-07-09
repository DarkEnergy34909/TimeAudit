document.getElementById("signup-form").onsubmit = async function(event) {
    // Prevent default form submission
    event.preventDefault();

    // Get form data (event.target refers to the form)
    // In general, event.target is the form element that triggered the event
    const formData = new FormData(event.target);

    // Make POST request to the server
    const response = await fetch("/signup", {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest" // Indicate that this is an AJAX request
        }
    })

    const data = await response.json();
    
    if (response.ok && data.token) {
        // Store the token in localStorage
        localStorage.setItem("token", data.token);

        // Redirect to calendar page
        window.location.href = "/calendar";
    }
    else {
        // Handle errors
        if (data.error == "invalid_email_or_password") {
            // Show error message for invalid email or password
            document.getElementById("generic-signup-error").hidden = false;
        }

        else if (data.error == "invalid_email") {
            // Show error message for invalid email
            document.getElementById("generic-signup-error").hidden = false;
        }

        else if (data.error == "duplicate_email") {
            // Show error message for duplicate email
            document.getElementById("email-exists-error").hidden = false;
        }
        else if (data.error == "server_error") {
            // Show generic error message
            document.getElementById("generic-signup-error").hidden = false;
        }
        else {
            // Show generic error message
            document.getElementById("generic-signup-error").hidden = false;
        }
    }
}