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
        // Store the token in localStorage
        // TODO: Use HttpOnly

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