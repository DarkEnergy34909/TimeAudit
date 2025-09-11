// Code to add text to donut chart
Chart.pluginService.register({
  beforeDraw: function(chart) {
    if (chart.config.options.elements.center) {
      // Get ctx from string
      var ctx = chart.chart.ctx;

      // Get options from the center object in options
      var centerConfig = chart.config.options.elements.center;
      var fontStyle = centerConfig.fontStyle || 'Arial';
      var txt = centerConfig.text;
      var color = centerConfig.color || '#000';
      var maxFontSize = centerConfig.maxFontSize || 75;
      var sidePadding = centerConfig.sidePadding || 20;
      var sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2)
      // Start with a base font of 30px
      ctx.font = "30px " + fontStyle;

      // Get the width of the string and also the width of the element minus 10 to give it 5px side padding
      var stringWidth = ctx.measureText(txt).width;
      var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;

      // Find out how much the font can grow in width.
      var widthRatio = elementWidth / stringWidth;
      var newFontSize = Math.floor(30 * widthRatio);
      var elementHeight = (chart.innerRadius * 2);

      // Pick a new font size so it will not be larger than the height of label.
      var fontSizeToUse = Math.min(newFontSize, elementHeight, maxFontSize);
      var minFontSize = centerConfig.minFontSize;
      var lineHeight = centerConfig.lineHeight || 25;
      var wrapText = false;

      if (minFontSize === undefined) {
        minFontSize = 20;
      }

      if (minFontSize && fontSizeToUse < minFontSize) {
        fontSizeToUse = minFontSize;
        wrapText = true;
      }

      // Set font settings to draw it correctly.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
      var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
      ctx.font = fontSizeToUse + "px " + fontStyle;
      ctx.fillStyle = color;

      if (!wrapText) {
        ctx.fillText(txt, centerX, centerY);
        return;
      }

      var words = txt.split(' ');
      var line = '';
      var lines = [];

      // Break words up into multiple lines if necessary
      for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = ctx.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > elementWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }

      // Move the center up depending on line height and number of lines
      centerY -= (lines.length / 2) * lineHeight;

      for (var n = 0; n < lines.length; n++) {
        ctx.fillText(lines[n], centerX, centerY);
        centerY += lineHeight;
      }
      //Draw text in center
      ctx.fillText(line, centerX, centerY);
    }
  }
});

// Options for displaying dates
const dateOptions = {
    year: "numeric",
    month: "short",
    day: "numeric"
};


// A goal has the following properties:
// title: string (e.g. "Get money")
// duration: int (e.g. 60 for 60 minutes)
// timeDone: int (e.g. 30 for 30 minutes of the goal done)
// date: string (ISO - the deadline of the goal)
// dateCompleted: string (ISO - when the goal was actually met)

let goals = [];

function initialiseEmailAddress() {
    const emailElement = document.querySelector(".email-address");

    // If the email is there
    if (emailElement) {

        emailElement.onclick = function () {
            // Get the email drop-down
            const emailMenu = document.querySelector(".email-menu");

            if (emailMenu.hidden == true) {
                emailMenu.hidden = false;
            }
            else {
                emailMenu.hidden = true;
            }
        }
    }
}

function openDeleteAccountMenu() {
    const deleteAccountMenu = document.querySelector(".delete-account-menu");

    if (deleteAccountMenu) {
        deleteAccountMenu.hidden = false;
    }
}

function closeDeleteAccountMenu() {
    const deleteAccountMenu = document.querySelector(".delete-account-menu");

    if (deleteAccountMenu) {
        deleteAccountMenu.hidden = true;
    }
}

function openChangeEmailMenu() {
    const changeEmailMenu = document.querySelector(".change-email-menu");

    if (changeEmailMenu) {
        changeEmailMenu.hidden = false;
    }
}

function closeChangeEmailMenu() {
    const changeEmailMenu = document.querySelector(".change-email-menu");

    if (changeEmailMenu) {
        changeEmailMenu.hidden = true;
    }
}

function openAddMenu() {
    // Put the deadline as today by default
    const deadlineInput = document.querySelector("#goal-deadline");
    deadlineInput.value = getIsoString(new Date());

    const addMenu = document.querySelector(".add-menu");
    addMenu.hidden = false;
}

function closeAddMenu() {
    const addMenu = document.querySelector(".add-menu");
    addMenu.hidden = true;
}

function showToastNotification(message) {
    // Unhide the toast notification element
    const toastNotification = document.querySelector(".toast-notification");
    toastNotification.style.display = "flex";

    // Set the message
    const toastMessage = document.querySelector(".toast-message");
    toastMessage.textContent = message;
}

function closeToastNotification() {
    // Hide the toast notification element
    const toastNotification = document.querySelector(".toast-notification");
    toastNotification.style.display = "none";

    // Clear the message
    const toastMessage = document.querySelector(".toast-message");
    toastMessage.textContent = "";
}

function addGoal() {
    // Get the goal attributes
    const goalName = document.querySelector("#goal-name").value;
    const goalDuration = (parseInt(document.querySelector("#goal-duration-minutes").value)) + (60 * parseInt(document.querySelector("#goal-duration-hours").value));
    const goalDateString = document.querySelector("#goal-deadline").value;
    const goalDateObj = new Date(goalDateString);

    // If the goal name is empty, display an error message
    if (goalName == "") {
        document.querySelector("#goal-name-error").hidden = false;

        return;
    }

    // If the duration is not a number, display an error message
    if (isNaN(goalDuration) || goalDuration == 0) {
        document.querySelector("#duration-error").hidden = false;
        return;
    }

    // Check if the date is valid
    if (goalDateObj.toString() === "Invalid Date") {
        const errorText = document.getElementById("deadline-error");
        errorText.hidden = false; // Show the error message
        console.log("Invalid date");
        return;
    }

    // Convert the date to ISO string format
    const isoDate = getIsoString(goalDateObj);

    // Check if the date is in the past
    if (isoDate < getIsoString(new Date())) {
        const errorText = document.getElementById("deadline-error");
        errorText.hidden = false; // Show the error message
        console.log("Date is in the past");
        return;
    }

    // Create a goal object
    const newGoal = {
        title: goalName,
        duration: goalDuration, 
        timeDone: 0,
        completed: false,
        date: isoDate,
        dateCompleted: ""
    }

    // Save the goal
    saveGoal(newGoal);

    // Save the goal to the server
    saveGoalToServer(newGoal);

    // Create a new UI element for the goal
    addGoalCard(newGoal, true, true); // Add an outstanding goal to the top of the list


    // Clear the form inputs
    document.querySelector("#goal-name").value = "";
    document.querySelector("#goal-duration-hours").value = "0";
    document.querySelector("#goal-duration-minutes").value = "0";
    document.querySelector("#goal-deadline").value = "";

    // Hide the error messages
    document.querySelector("#goal-name-error").hidden = true;
    document.querySelector("#duration-error").hidden = true;
    document.querySelector("#deadline-error").hidden = true;

    // Close the menu
    closeAddMenu();

    // Hide the no goals element
    document.querySelector(".no-goals-text").hidden = true;
}

async function saveGoalToServer(goal) {
    // Check if authenticated
    const authStatus = await checkAuth();
    if (authStatus == true) {
        // Create an array
        const tempArray = [goal];

        // Convert to JSON
        const goalString = JSON.stringify(tempArray);

        // Send the request
        const goalsResponse = await fetch("/api/goals", {
            method: "POST",
            body: goalString,
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        const goalsData = await goalsResponse.json();

        if (!goalsResponse.ok ||!goalsData.success) {
            // Send an alert that the activity was NOT posted to the server
            //alert("Failed to post goal to the server. Check your network connection.");
            showToastNotification("Failed to post task to server. Check your network connection.");
        }
        else {
            //alert("Posted goal successfully");
            // Show a toast notification
            showToastNotification(`Task '${goal.title}' added successfully! 🎉`);
        }
    }
    else if (authStatus == false) {
        //alert("NOT AUTHENTICATED");
    }
}

async function removeGoalFromServer(goal) {
    // Check if authenticated
    const authStatus = await checkAuth();
    if (authStatus == true) {
        // Send a POST request with the goal
        const goalString = JSON.stringify(goal);

        const goalResponse = await fetch("/api/goals/remove", {
            method: "POST",
            body: goalString,
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }
        })

        const goalData = await goalResponse.json();

        if (!goalResponse.ok ||!goalData.success) {
            // Send an alert that the goal was NOT posted to the server
            //alert("Failed to delete activity from server. Check your network connection.");
            showToastNotification("Failed to delete task from server. Check your network connection.");
        }
        else {
            //alert("Deleted activity successfully");
            // Show a toast notification
            showToastNotification(`Task '${goal.title}' deleted successfully.`);
        }
    }
    else if (authStatus == false) {
        //alert("NOT AUTHENTICATED");
    }
}

async function updateGoalOnServer(goal) {
    // Check if authenticated
    const authStatus = await checkAuth();

    if (!authStatus) {
        return;
    }

    // Send a POST request to the server
    const goalResponse = await fetch("/api/goals/update", {
        method: "POST",
        body: JSON.stringify(goal),
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
        }
    })

    const goalData = await goalResponse.json();
    if (!goalResponse.ok || !goalData.success) {
        // Send an alert that the goal was NOT updated on the server
        //alert("Failed to update goal on server. Check your network connection.");
        showToastNotification("Failed to sync task to server. Check your network connection.");
    }
    else {
        // Goal has been updated successfully
        // Show toast notification
        showToastNotification(`Task '${goal.title}' updated successfully.`);
    }
}

// Creates a UI element for the goal
function addGoalCard(goal, outstanding, justAdded=false) {
    const goalTitle = goal.title;
    const goalDuration = goal.duration;
    const goalTimeDone = goal.timeDone;
    const goalDate = goal.date;
    const goalDateCompleted = goal.dateCompleted;
    
    // Create a div for the goal
    const goalDiv = document.createElement("div");
    goalDiv.classList.add("goal-card");

    // Set a colour for the goal card if necessary
    if (!outstanding) {
        // Get the date of the goal as a locale date string
        const localeDate = new Date(goalDateCompleted).toLocaleDateString(undefined, dateOptions);

        // Create a date for the goal
        const goalDateElement = document.createElement("span");
        goalDateElement.classList.add("goal-date");
        goalDateElement.classList.add("completed");
        goalDateElement.textContent = `Completed ${localeDate}`;
        goalDiv.appendChild(goalDateElement);
    }
    else {
        // OVERDUE GOALS
        if (goalTimeDone < goalDuration && goalDate < getIsoString(new Date())) {

            // Work out how many days ago the goal was due
            const daysOverdue = parseInt((new Date() - new Date(goalDate)) / (1000 * 60 * 60 * 24));

            // Add due text
            const goalDueElement = document.createElement("span");
            goalDueElement.classList.add("goal-date");
            goalDueElement.classList.add("uncompleted");
            if (daysOverdue == 1) {
                goalDueElement.textContent = "Due yesterday";
            }
            else {
                goalDueElement.textContent = `Due ${daysOverdue} days ago`;
            }
            goalDiv.appendChild(goalDueElement);

        }

        // COMPLETED TODAY GOALS
        else if (goalTimeDone >= goalDuration) {

            // Add completed text
            const goalCompletedElement = document.createElement("span");
            goalCompletedElement.classList.add("goal-date");
            goalCompletedElement.classList.add("completed");
            goalCompletedElement.textContent = "Completed today";
            goalDiv.appendChild(goalCompletedElement);
        }

        // NOT-DUE-YET GOALS
        else {
            // Work out in how many days the goal is due
            const daysDue = parseInt(((new Date(goalDate) - new Date()) / (1000 * 60 * 60 * 24)) + 1);

            // Add due text
            const goalDueElement = document.createElement("span");
            goalDueElement.classList.add("goal-date");

            if (daysDue == 0) {
                goalDueElement.classList.add("due-today");
                goalDueElement.textContent = "Due today";
            }
            else if (daysDue == 1) {
                goalDueElement.textContent = "Due tomorrow";
            }
            else {
                goalDueElement.textContent = `Due in ${daysDue} days`;
            }

            goalDiv.appendChild(goalDueElement);
        }
    }

    // Create a div for the goal text
    const goalText = document.createElement("span");
    goalText.classList.add("goal-text");
    //goalText.textContent = goalTitle + " - " + goalDuration + " minutes";
    goalText.textContent = goalTitle + " - " + goalTimeDone + " / " + goalDuration + " min completed";
    goalDiv.appendChild(goalText);

    // Create a div for the progress chart
    const goalChartContainer = document.createElement("div");
    goalChartContainer.classList.add("goal-progress-container");

    // Create the chart element
    const goalChart = document.createElement("canvas");
    //const goalChartId = goalTitle + "-" + goalDuration + "-" + goalDate + "-chart";
    const goalChartId = goalTitle + goalDate + "-chart";
    goalChart.id = goalChartId;
    goalChart.width = "100";
    goalChart.height = "100";

    goalChartContainer.appendChild(goalChart);
    goalDiv.appendChild(goalChartContainer);

    // Create a delete (X) button for the goal
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("goal-delete-button");
    deleteButton.textContent = "×";
    deleteButton.hidden = true;

    deleteButton.onclick = async function() {
        // Remove the goal element
        goalDiv.remove();

        // Remove the goal from the goals array
        for (let i = 0; i < goals.length; i++) {
            if (goals[i].title == goalTitle && goals[i].duration == goalDuration && goals[i].timeDone == goalTimeDone && goals[i].date == goalDate) {
                // Remove the goal from the server
                await removeGoalFromServer(goals[i]);

                // Remove the goal at index i
                goals.splice(i, 1);

                // Update local storage
                await updateGoalsStorage();

                break;
            }
        }

        // Remove the goal from the associated activity
        const activitiesString = localStorage.getItem("activities");

        if (activitiesString) {
            let activities = JSON.parse(activitiesString);

            for (let i = 0; i < activities.length; i++) {
                // Remove the goal name property from the activities associated with this goal
                if (activities[i].goalName == goalTitle && activities[i].date == goalDate) {
                    // Delete the activity
                    activities.splice(i, 1);

                    // Save to local storage
                    localStorage.setItem("activities", JSON.stringify(activities));
                }
            }
        }
    }
    goalDiv.appendChild(deleteButton);

    // Should only be able to mark the goal as complete if it is outstanding
    if (outstanding) {
        // Create a button to manually mark the goal as completed
        const completedButton = document.createElement("button");
        completedButton.classList.add("goal-completed-button");
        completedButton.textContent = "✓";
        completedButton.hidden = true;
    
        // When the button is clicked, mark the goal as completed
        completedButton.onclick = async function() {
            // Get the goal
            for (let i = 0; i < goals.length; i++) {
                if (goals[i].title == goalTitle && goals[i].duration == goalDuration && goals[i].timeDone == goalTimeDone && goals[i].date == goalDate) {
                    // Set the time done to the duration
                    goals[i].timeDone = goals[i].duration;
                    //goals[i].completed = true; // I DONT REMEMBER EVER DOING THIS
                    goals[i].dateCompleted = getIsoString(new Date());

                    // Update the goal on the server
                    await updateGoalOnServer(goals[i]);

                    // Update local storage
                    updateGoalsStorage();

                    // Update the UI element
                    goalText.textContent = goalTitle + " - " + goals[i].timeDone + " / " + goals[i].duration + " min completed";
                    const completedText = goalDiv.querySelector(".goal-date");

                    // Remove any existing classes from the completed text
                    if (completedText.classList.contains("uncompleted")) {
                        completedText.classList.remove("uncompleted");
                    }
                    else if (completedText.classList.contains("due-today")) {
                        completedText.classList.remove("due-today");
                    }

                    completedText.classList.add("completed");
                    completedText.textContent = "Completed today";

                    // Update the chart
                    createProgressChart(goalChartId, goals[i].timeDone, goals[i].duration);

                    // Show a toast notification
                    //showToastNotification(`Task '${goals[i].title}' completed! 🎉`);
                }
            }
        }
        goalDiv.appendChild(completedButton);
    }

    // Hide/unhide the delete button when hovering
    goalDiv.onmouseover = function() {
        // Get the delete button and hide it
        const deleteButton = goalDiv.querySelector(".goal-delete-button");
        deleteButton.hidden = false;

        if (outstanding) {
            // Get the completed button and hide it
            const completedButton = goalDiv.querySelector(".goal-completed-button");
            completedButton.hidden = false;
        }
    }

    goalDiv.onmouseout = function() {
        // Get the delete button and show it
        const deleteButton = goalDiv.querySelector(".goal-delete-button");
        deleteButton.hidden = true;

        if (outstanding) {
            // Get the completed button and show it
            const completedButton = goalDiv.querySelector(".goal-completed-button");
            completedButton.hidden = true;
        }
    }

    // Get the container for the goal div and add the div
    const goalsList = document.querySelector("#goals-list");

    // If the user has just added the goal, prepend it to the start of the list
    if (justAdded) {
        goalsList.prepend(goalDiv);
    }
    else {
        goalsList.appendChild(goalDiv);
    }

    // Create the actual chart object
    createProgressChart(goalChartId, goalTimeDone, goalDuration);

}

// Saves a goal to the goals array and local storage
function saveGoal(goal) {
    goals.push(goal);

    localStorage.setItem("goals", JSON.stringify(goals));
}

// Updates localstorage with the current state of the goals array
function updateGoalsStorage() {
    localStorage.setItem("goals", JSON.stringify(goals));
}

function getIsoString(date) {
    // Get the date in YYYY-MM-DD format
    const isoString = date.toISOString().split('T')[0]; // Get the date part of the ISO string
    return isoString; 
}
 
function loadGoals(outstanding) {
    const goalsString = localStorage.getItem("goals");

    if (goalsString) {
        goals = JSON.parse(goalsString);
        const currentGoals = [];
        let added = false;

        for (let i = 0; i < goals.length; i++) {
            // If getting today's goals
            if (outstanding) {
                // If the goal's date is today (or after), add it to the page
                if (goals[i].dateCompleted == "" || goals[i].dateCompleted == getIsoString(new Date()) /*goals[i].date >= getIsoString(new Date()) || goals[i].timeDone < goals[i].duration*/) {
                    // Add goal to current goals
                    currentGoals.push(goals[i]);
                    //addGoalCard(goals[i], true); // true = today - goal cards are white
                    added = true;
                }
            }
            else {
                // If the goal's date is before today, add it to the page
                if (goals[i].dateCompleted != "" && goals[i].dateCompleted != getIsoString(new Date())/*goals[i].date < getIsoString(new Date()) && goals[i].timeDone >= goals[i].duration*/) {
                    // Add goal to current goals
                    currentGoals.push(goals[i]);
                    //addGoalCard(goals[i], false); // false = not today - goal cards are green/red
                    added = true;
                }
            }
        }

        // Reverse currentGoals so it is sorted descending IF the goals aren't due goals
        if (!outstanding) {
            currentGoals.reverse();
        }

        // Add to the page
        for (let i = 0; i < currentGoals.length; i++) {
            addGoalCard(currentGoals[i], outstanding);
        }

        if (!added) {
            if (outstanding) {
                const goalsMenu = document.querySelector(".goals-menu");

                const goalMessage = document.createElement("span");
                goalMessage.textContent = "You have no outstanding tasks. Add a task to get started.";
                goalMessage.classList.add("no-goals-text");

                goalsMenu.appendChild(goalMessage);
            }
            else {
                const goalsMenu = document.querySelector(".goals-menu");

                const goalMessage = document.createElement("span");
                goalMessage.textContent = "You have no completed tasks. Get a move on!";
                goalMessage.classList.add("no-goals-text");

                goalsMenu.appendChild(goalMessage);
            }
        }
    }
    else {
        if (outstanding) {
            const goalsMenu = document.querySelector(".goals-menu");

            const goalMessage = document.createElement("span");
            goalMessage.textContent = "You have no outstanding tasks. Add a task to get started.";
            goalMessage.classList.add("no-goals-text");

            goalsMenu.appendChild(goalMessage);
        }
        else {
            const goalsMenu = document.querySelector(".goals-menu");

            const goalMessage = document.createElement("span");
            goalMessage.textContent = "You have no previous tasks. Get a move on!";
            goalMessage.classList.add("no-goals-text");

            goalsMenu.appendChild(goalMessage);
        }
    }
}

function resetGoals() {
    // Delete all current goal HTML elements from the page
    const goals = document.querySelectorAll(".goal-card")

    for (let i = 0; i < goals.length; i++) {
        goals[i].remove();
    }

    // Delete the no goals message if there is one
    const noGoalsMessage = document.querySelector(".no-goals-text");
    if (noGoalsMessage) {
        noGoalsMessage.remove();
    }
}

//
function createProgressChart(id, amountDone, total) {
    const percentDone = parseInt((amountDone / total) * 100);
    let percentNotDone;

    // If the goal has been overfulfilled, set percentNotDone to 0
    if (amountDone > total) {
        percentNotDone = 0;
    }
    else {
        percentNotDone = 100 - percentDone;
    }

    return new Chart(id, {
        type: "doughnut",
        data: {
            labels: [],
            datasets: [{
                backgroundColor: ["#22C55E", "#d4d4d4"],
                data: [percentDone, percentNotDone]
            }]
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false,
                },
                tooltip: {
                    display: false
                }
            },
            tooltips: {
                enabled: false
            },
            hover: {
                mode: null
            },
            cutoutPercentage: 75,
            elements: {
                center: {
                    text: percentDone + "%",
                    fontStyle: "Poppins",
                    // color:
                    // fontStyle
                    sidePadding: "50",
                    minFontSize: "10",
                    //lineHeight: "5"
                },
                arc: {
                    borderWidth: 0
                }
            }
        }
    })
}

function initialiseGoalSelectorButtons() {
    const todayButton = document.querySelector("#today-button");
    const previousButton = document.querySelector("#previous-button");

    if (todayButton.classList.contains("selected")) {
        todayButton.classList.remove("selected");

        previousButton.classList.add("selected");
    }
    else {
        todayButton.classList.add("selected");

        previousButton.classList.remove("selected");
    }
}

function onTodayButtonClick() {
    const todayButton = document.querySelector("#today-button");
    const previousButton = document.querySelector("#previous-button");

    if (!todayButton.classList.contains("selected")) {
        todayButton.classList.add("selected")

        // Load today's goals
        resetGoals();
        loadGoals(true); // true = today's goals are loaded
    }
    if (previousButton.classList.contains("selected")) {
        previousButton.classList.remove("selected");
    }
}

function onPreviousButtonClick() {
    const todayButton = document.querySelector("#today-button");
    const previousButton = document.querySelector("#previous-button");

    if (!previousButton.classList.contains("selected")) {
        previousButton.classList.add("selected")

        // Load other days' goals
        resetGoals();
        loadGoals(false); // false = previous days' goals are loaded
    }
    if (todayButton.classList.contains("selected")) {
        todayButton.classList.remove("selected");
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

async function pullGoalsFromServer() {
    const authResult = await checkAuth();
    if (authResult == true) {
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
}

// Logout function
async function logout() {
    const authResult = await checkAuth();
    if (authResult == true) {
        // Send a POST request to the API to logout
        const logoutResponse = await fetch("/api/logout", {
            method: "POST",
            body: {},
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
        })

        const logoutData = await logoutResponse.json();

        if (logoutResponse.ok && logoutData.success) {
            // Clear local storage
            localStorage.removeItem("activities");
            localStorage.removeItem("goals");
            localStorage.removeItem("current_activity");
            localStorage.removeItem("running_activity");
            localStorage.removeItem("scheduled_activities");

            // Redirect to landing page
            window.location.href = "/";
        }
    }
}

async function changeEmailAddress() {
    const authResult = await checkAuth();

    if (authResult == true) {
        // Get the email address
        const emailAddress = document.querySelector("#new-email").value;

        // Send a POST request to the API to delete the user's account
        const changeEmailResponse = await fetch("/api/account/change-email", {
            method: "POST",
            body: JSON.stringify({"email-address": emailAddress}),
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
        })

        const changeEmailData = await changeEmailResponse.json();
        if (changeEmailResponse.ok && !changeEmailData.error) {
            // Reset form input
            document.querySelector("#new-email").value = "";

            // Hide all errors
            const changeEmailMenu = document.querySelector(".change-email-menu");
            const errorMessages = changeEmailMenu.querySelectorAll("error-text");

            for (let i = 0; i < errorMessages.length; i++) {
                errorMessages[i].hidden = true;
            }

            // Close the menu
            closeChangeEmailMenu();

            // Refresh the page
            window.location.reload();
        }
        else if (changeEmailData.error == "email_exists") {
            // Show the error message
            document.querySelector("#email-exists-error").hidden = false;

            // Hide the other error messages
            document.querySelector("#invalid-email-error").hidden = true;
            document.querySelector("#generic-email-error").hidden = true;
        }

        else if (changeEmailData.error == "invalid_email") {
            // Show the error message
            document.querySelector("#invalid-email-error").hidden = false;

            // Hide the other error messages
            document.querySelector("#email-exists-error").hidden = true;
            document.querySelector("#generic-email-error").hidden = true;
        }
        else {
            // Show the error message
            document.querySelector("#generic-email-error").hidden = false;

            // Hide the other error messages
            document.querySelector("#email-exists-error").hidden = true;
            document.querySelector("#invalid-email-error").hidden = true;
        }
    }
}

async function deleteAccount() {
    const authResult = await checkAuth();
    if (authResult == true) {
        // Send a POST request to the API to delete the user's account
        const deleteAccountResponse = await fetch("/api/account/delete", {
            method: "POST",
            body: {},
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
        })

        const deleteAccountData = await deleteAccountResponse.json();

        if (deleteAccountResponse.ok && deleteAccountData.success) {
            // Redirect to landing page
            window.location.href = "/";
        }

        // Clear local storage
        localStorage.removeItem("activities");
        localStorage.removeItem("goals");
        localStorage.removeItem("current_activity");
        localStorage.removeItem("running_activity");
    }
}

function removeLoadingScreen() {
    document.querySelector(".loading-screen").remove();
}

async function init() {
    await pullGoalsFromServer();
    loadGoals(true);
    initialiseGoalSelectorButtons();
    initialiseEmailAddress();
    removeLoadingScreen();
}

init();