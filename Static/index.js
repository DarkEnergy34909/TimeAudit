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

checkAuthAndRedirect();