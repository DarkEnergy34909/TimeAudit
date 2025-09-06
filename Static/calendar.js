// The current date
let currentDate = new Date();

// The first day of the current week
let firstDayOfCurrentWeek = new Date(currentDate.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7))); 

// The first day of the week displayed on-screen (not necessarily the current week)
let firstDayOfWeek = new Date(firstDayOfCurrentWeek);

// A list of all activities 
let activities = [];

// A list of all scheduled activities
let scheduledActivities = [];

// A list of all suggested scheduled activities
let suggestedScheduledActivities = [];

// The index of the current activity in the activities array
let currentActivityIndex = -1;

// The index of the activity currently being edited
let editedActivityIndex = -1;

// The id of the activity currently being edited
let editedActivityId = -1;

// The block currently being edited
let editedBlock = null;

// The previous goal of the activity currently being edited
let prevGoal = "None";

// A flag to indicate if the page has loaded initially
let initialPageLoad = true;

// An activity has the following properties
// title: string (e.g. "Gym")
// category: string (e.g. "Exercise")
// startTime: int (e.g. 510 for 08:30)
// endTime: int (e.g. 600 for 10:00)
// date: string (e.g. "2023-10-01")
// goalName: string (e.g. "Study Physics")

// A scheduled activity has the following properties
// title: string (e.g. "Gym")
// category: string (e.g. "Exercise")
// startTime: int (e.g. 510 for 08:30)
// endTime: int (e.g. 600 for 10:00)
// date: string (e.g. "2023-10-01")

// Putting this here to remind myself what a stupid ass design decision this was
// startTime: float (e.g. 8.5 for 08:30)
// endTime: float (e.g. 10.0 for 10:00)
let readyForMove = false;

// Make it so that calendar blocks are vertically draggable
interact('.scheduled-block').draggable({
    // Enable dragging along the y-axis only
    axis: 'y',
    modifiers: [
        interact.modifiers.restrict({
            //restriction: 'parent',
            endOnly: true
        })
    ],
    listeners: {
        async start(event) {
            // Prevent this on mobile
            if (isMobile()) {
                return;
            }

            // Get the block element
            const target = event.target;

            // Get the block's data attributes
            let blockDay = parseInt(target.getAttribute("data-day")) || 0;
            let startTime = parseInt(target.getAttribute("data-start-time")) || 0;
            let endTime = parseInt(target.getAttribute("data-end-time")) || 0;

            // Get the activity
            const scheduledActivity = scheduledActivities.find(activity => activity.title == target.querySelector(".scheduled-block-text").textContent && blockDay == (new Date(activity.date).getDay() + 6) % 7 && activity.startTime == startTime && activity.endTime == endTime);

            if (scheduledActivity) {
                // Delete the scheduled activity from the server
                console.log("REMOVING ACTIVITY...");
                await removeScheduledActivityFromServer(scheduledActivity);
                readyForMove = true;
            }
            else {
                console.log("WTF???");
            }
        },

        move (event) {
            // Prevent this on mobile
            if (isMobile()) {
                return;
            }

            if (!readyForMove) {
                return;
            }

            // Get the calendar grid
            const calendarGrid = document.querySelector(".calendar-grid");

            // Get the element
            const target = event.target;

            // Get the block's data attributes
            let blockDay = parseInt(target.getAttribute("data-day")) || 0;
            let startTime = parseInt(target.getAttribute("data-start-time")) || 0;
            let endTime = parseInt(target.getAttribute("data-end-time")) || 0;

            // Get the y position
            let y = parseFloat(target.style.top) || 0;

            // Get the height
            let height = event.rect.height;

            // Adjust the y position
            target.style.top = y + event.dy + 'px';

            // Get the height of a grid row
            const gridRowHeight = calendarGrid.offsetHeight / 24;

            // Get the scheduled activity
            let scheduledActivity = scheduledActivities.find(activity => activity.title == target.querySelector(".scheduled-block-text").textContent && blockDay == (new Date(activity.date).getDay() + 6) % 7 && activity.startTime == startTime && activity.endTime == endTime);

            if (!scheduledActivity) {
                return;
            }
            // Update the scheduled activity's start/end times
            for (let i = 0; i < scheduledActivities.length; i++) {
                if (JSON.stringify(scheduledActivities[i]) === JSON.stringify(scheduledActivity)) {
                    // Calculate activity times from y position and height
                    const newStartTime = Math.floor((y * 60 / gridRowHeight));
                    const newEndTime = Math.floor(((y + height) * 60 / gridRowHeight));

                    // Adjust the activity's start and end times
                    scheduledActivity.startTime = newStartTime;
                    scheduledActivity.endTime = newEndTime;

                    // Update the block's text to reflect the new start and end times
                    target.querySelector(".scheduled-block-time").textContent = `${getTimeFromMinutes(scheduledActivity.startTime)} - ${getTimeFromMinutes(scheduledActivity.endTime)}`;

                    // Update the scheduled activity in the local storage
                    scheduledActivities[i] = scheduledActivity;
                    localStorage.setItem("scheduled_activities", JSON.stringify(scheduledActivities));

                    // Update the block's data attributes
                    target.setAttribute("data-start-time", newStartTime);
                    target.setAttribute("data-end-time", newEndTime);
                }
            }

        },

        end (event) {
            // Prevent this on mobile
            if (isMobile()) {
                return;
            }

            // Add the scheduled activity back to the server
            const target = event.target;

            // Get the block's data attributes
            let blockDay = parseInt(target.getAttribute("data-day")) || 0;
            let startTime = parseInt(target.getAttribute("data-start-time")) || 0;
            let endTime = parseInt(target.getAttribute("data-end-time")) || 0;

            // Get the activity
            const scheduledActivity = scheduledActivities.find(activity => activity.title == target.querySelector(".scheduled-block-text").textContent && blockDay == (new Date(activity.date).getDay() + 6) % 7 && activity.startTime == startTime && activity.endTime == endTime);

            if (scheduledActivity) {
                // Add the activity to the server
                saveScheduledActivityToServer(scheduledActivity);
            }

            // Reset the readyForMove flag
            readyForMove = false;
        }
    },
    inertia: false
});

// Make scheduled calendar blocks vertically resizable
interact('.scheduled-block').resizable({
    // Enable resizing from top and bottom edges only
    edges: { top: true, bottom: true, left: false, right: false },

    listeners: {
        async start(event) {
            // Prevent this on mobile
            if (isMobile()) {
                return;
            }

            // Get the block element
            const target = event.target;

            // Get the block's data attributes
            let blockDay = parseInt(target.getAttribute("data-day")) || 0;
            let startTime = parseInt(target.getAttribute("data-start-time")) || 0;
            let endTime = parseInt(target.getAttribute("data-end-time")) || 0;

            // Get the activity
            const scheduledActivity = scheduledActivities.find(activity => activity.title == target.querySelector(".scheduled-block-text").textContent && blockDay == (new Date(activity.date).getDay() + 6) % 7 && activity.startTime == startTime && activity.endTime == endTime);

            if (scheduledActivity) {
                // Delete the scheduled activity from the server
                console.log("REMOVING ACTIVITY...");
                await removeScheduledActivityFromServer(scheduledActivity);
                readyForMove = true;
            }
            else {
                console.log("WTF???");
            }

        },
        move (event) {
            // Prevent this on mobile
            if (isMobile()) {
                return;
            }

            if (!readyForMove) {
                return;
            }

            let target = event.target;

            // Get the y position
            let y = parseFloat(target.style.top) || 0;

            // Get the height
            let height = event.rect.height;

            // Get the day
            let blockDay = parseInt(target.getAttribute("data-day")) || 0;

            const calendarGrid = document.querySelector(".calendar-grid");
            const gridItems = calendarGrid.querySelectorAll(".grid-item");

            // Get the height of a grid row
            const gridRowHeight = calendarGrid.offsetHeight / 24;

            // Get the width of a grid column
            const gridColumnWidth = gridItems[0].offsetWidth;

            // Get the start time and end time from the block
            let startTime = parseInt(target.getAttribute("data-start-time")) || 0;
            let endTime = parseInt(target.getAttribute("data-end-time")) || 0;

            // Get the activity
            let scheduledActivity = scheduledActivities.find(activity => activity.title == target.querySelector(".scheduled-block-text").textContent && blockDay == (new Date(activity.date).getDay() + 6) % 7 && activity.startTime == startTime && activity.endTime == endTime);
            console.log(scheduledActivity);

            // If resizing from the top, adjust the top position
            if (event.edges.top) {
                y += event.deltaRect.top;
                target.style.top = y + 'px';
            }

            // Adjust the height
            target.style.height = height + 'px';

            // Update the scheduled activity's start/end times
            for (let i = 0; i < scheduledActivities.length; i++) {
                if (JSON.stringify(scheduledActivities[i]) === JSON.stringify(scheduledActivity)) {
                    // Calculate activity times from y position and height
                    const newStartTime = Math.floor((y * 60 / gridRowHeight));
                    const newEndTime = Math.floor(((y + height) * 60 / gridRowHeight));

                    // Adjust the activity's start and end times
                    scheduledActivity.startTime = newStartTime;
                    scheduledActivity.endTime = newEndTime;

                    // Update the block's text to reflect the new start and end times
                    target.querySelector(".scheduled-block-time").textContent = `${getTimeFromMinutes(scheduledActivity.startTime)} - ${getTimeFromMinutes(scheduledActivity.endTime)}`;

                    // Update the scheduled activity in the local storage
                    scheduledActivities[i] = scheduledActivity;
                    localStorage.setItem("scheduled_activities", JSON.stringify(scheduledActivities));

                    // Update the block's data attributes
                    target.setAttribute("data-start-time", newStartTime);
                    target.setAttribute("data-end-time", newEndTime);
                }
            }
        },
        end (event) {
            // Prevent this on mobile
            if (isMobile()) {
                return;
            }

            // Add the scheduled activity back to the server
            const target = event.target;

            // Get the block's data attributes
            let blockDay = parseInt(target.getAttribute("data-day")) || 0;
            let startTime = parseInt(target.getAttribute("data-start-time")) || 0;
            let endTime = parseInt(target.getAttribute("data-end-time")) || 0;

            // Get the activity
            const scheduledActivity = scheduledActivities.find(activity => activity.title == target.querySelector(".scheduled-block-text").textContent && blockDay == (new Date(activity.date).getDay() + 6) % 7 && activity.startTime == startTime && activity.endTime == endTime);

            if (scheduledActivity) {
                // Add the activity to the server
                saveScheduledActivityToServer(scheduledActivity);
            }

            // Reset the readyForMove flag
            readyForMove = false;
        }
    },
    modifiers: [
        // Restrict resizing to a minimum height
        interact.modifiers.restrictSize({
            min: { height: 20 }
        })
    ],
    inertia: false
});

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

function isMobile() {
    return window.matchMedia("(max-width: 700px)").matches;
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

function populateCalendar() {
    // If on mobile
    if (isMobile()) {
        const calendarBody = document.querySelector('.body'); // Returns the body of the calendar, .body because it is a class (CSS selector)
        const timeColumn = document.querySelector('.time-column'); // Returns the time column of the calendar, .time-column because it is a class (CSS selector)
        const calendarGrid = document.querySelector('.calendar-grid'); // Returns the calendar grid, .calendar-grid because it is a class (CSS selector)

        // Get the current date
        const currentDate = new Date();

        // Create array with hours from 00:00 to 23:00
        const hours = [];
        for (let i = 0 ; i < 10; i++) {
            hours.push("0" + i + ":00");
        }
        for (let i = 10 ; i < 24; i++) {
            hours.push(i + ":00");
        }
        console.log(hours);

        // Populate hours column
        for (let hour of hours) {
            const hourDiv = document.createElement("div");
            hourDiv.classList.add("time-slot");
            hourDiv.textContent = hour;
            timeColumn.appendChild(hourDiv);
        }

        // Populate calendar grid with empty divs for the CURRENT DAY ONLY
        for (let i = 0; i < 24; i++) {
            const gridDiv = document.createElement("div");
            gridDiv.classList.add("grid-item");
            calendarGrid.appendChild(gridDiv);
        }

        // Hide the calendar navigation buttons on mobile
        document.querySelector("#prev-button").hidden = true;
        document.querySelector("#next-button").hidden = true;
    }
    // If on desktop
    else {
        const calendarBody = document.querySelector('.body'); // Returns the body of the calendar, .body because it is a class (CSS selector)
        const timeColumn = document.querySelector('.time-column'); // Returns the time column of the calendar, .time-column because it is a class (CSS selector)
        const calendarGrid = document.querySelector('.calendar-grid'); // Returns the calendar grid, .calendar-grid because it is a class (CSS selector)

        // Get the current date
        const currentDate = new Date();

        // Create array with hours from 00:00 to 23:00
        const hours = [];
        for (let i = 0 ; i < 10; i++) {
            hours.push("0" + i + ":00");
        }
        for (let i = 10 ; i < 24; i++) {
            hours.push(i + ":00");
        }
        console.log(hours);

        // Populate hours column
        for (let hour of hours) {
            const hourDiv = document.createElement("div");
            hourDiv.classList.add("time-slot");
            hourDiv.textContent = hour;
            timeColumn.appendChild(hourDiv);
        } 

        // Populate calendar grid with empty divs
        for (let i = 0; i < 7 * 24; i++) {
            const gridDiv = document.createElement("div");
            gridDiv.classList.add("grid-item");
            // Set the calendar grid to be slightly darker if it is on the current day
            if (i % 7 == getCurrentDay()) {
                gridDiv.classList.add("grid-item-today", "current-day");

            }
            calendarGrid.appendChild(gridDiv);
        }
        //let test = document.getElementById("test");
        //test.innerHTML = hours;
    }
}

function setMonthYear(date) {
    const monthYear = document.getElementById("month-year");
    const options = { month: 'long', year: 'numeric' };

    // Get the month and year from the date object
    const monthYearString = date.toLocaleDateString('en-US', options)
    monthYear.textContent = monthYearString;
}

function getMonth(date) {
    // Gets the month as a number from 0 to 11
    const month = date.getMonth();

    return month; 
}

function addActivity() {
    // Get the activity name, category, start time and end time from the form
    const activityName = document.getElementById("activity-name").value;
    const category = document.getElementById("category").value;
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;
    const goalName = document.getElementById("link-to-goal").value;

    // Get the start time and end time as floats (e.g. 8.5 for 08:30)
    //const startTimeFloat = stringTimeToFloat(startTime);
    //const endTimeFloat = stringTimeToFloat(endTime);

    // Get the start time and end time as minutes (e.g. 510 for 08:30)
    const startTimeMinutes = stringTimeToMinutes(startTime);
    const endTimeMinutes = stringTimeToMinutes(endTime);

    // Get the value of the start now checkbox
    const startNow = document.getElementById("start-now").checked;

    // If the activity name is empty, show an error message and return
    if (activityName.trim() === "") {
        const errorText = document.getElementById("activity-name-error");
        errorText.hidden = false; // Show the error message

        return;
    }

    // Check if the times are already occupied by an activity and return an error message if so

    for (let i = 0; i < activities.length; i++) {
        if (activities[i].date == getIsoString(new Date()) && ((startTimeMinutes >= activities[i].startTime && startTimeMinutes < activities[i].endTime) || (endTimeMinutes > activities[i].startTime && endTimeMinutes <= activities[i].endTime))) {
            const errorText = document.getElementById("time-input-error");
            errorText.hidden = false; // Show the error message

            return;
        }
    }

    // If the check now checkbox is checked, return (TODO)
    if (startNow) {
        // Hide the start activity button 
        const addButton = document.querySelector("#add-button");
        addButton.hidden = true;

        // Show the stop button and modify the text to the current activity
        const stopButton = document.querySelector("#stop-button");
        stopButton.textContent = "Stop '" + activityName + "'";
        stopButton.hidden = false;

        // Add the block to the calendar with a width of SOMETHING
        addBlock(activityName, category, startTimeMinutes, startTimeMinutes, getCurrentDay(), true);

        // Get the current date as an ISO string
        const currentDate = new Date(); 
        const isoString = getIsoString(currentDate);

        // Create a new activity object
        const activity = {
            title: activityName,
            category: category,
            startTime: startTimeMinutes,
            endTime: startTimeMinutes,
            date: isoString,
            goalName: goalName
        };

        // Add activity to the server as a running activity
        saveRunningActivityToServer(activity);

        // Get the index of the new activity and save to local storage
        currentActivityIndex = activities.length;
        localStorage.setItem("current_activity", currentActivityIndex)

        // Save the activity itself to local storage
        //localStorage.setItem("running_activity", JSON.stringify(activity));
        // Commenting this out because running activities are now saved to the server

        // Save the activity
        saveActivity(activity);

        // Close the add menu
        closeAddMenu();

        // Clear the form inputs
        document.getElementById("activity-name").value = "";
        document.getElementById("category").value = "Exercise";
        document.getElementById("start-time").value = "";
        document.getElementById("end-time").value = "";

        // Hide the error messages
        const activityErrorText = document.getElementById("activity-name-error");
        activityErrorText.hidden = true; // Hide the error message

        const timeErrorText = document.getElementById("time-input-error");
        timeErrorText.hidden = true; // Hide the error message

        return; 
    }

    // Check if the times are valid and return an error message if not
    if (startTime == "" || endTime == "" || startTimeMinutes >= endTimeMinutes) {
        const errorText = document.getElementById("time-input-error");
        errorText.hidden = false; // Show the error message

        return;
    }
    
    // Add the block to the calendar - activities.length is the index as this will be the index number of the activity when it is added to the array
    addBlock(activityName, category, startTimeMinutes, endTimeMinutes, getCurrentDay(), false); 

    // Get the current date as an ISO string
    const currentDate = new Date(); 
    const isoString = getIsoString(currentDate);

    // Create a new activity object
    const activity = {
        title: activityName,
        category: category,
        startTime: startTimeMinutes,
        endTime: endTimeMinutes,
        date: isoString,
        goalName: goalName
    };

    console.log(activities);

    // Update the goal
    addTimeToGoal(activity);

    // Save the activity to local storage
    saveActivity(activity);

    // Save the activity to the server if authenticated
    saveActivityToServer(activity);

    // Close the add menu
    closeAddMenu();

    // Clear the form inputs
    document.getElementById("activity-name").value = "";
    document.getElementById("category").value = "Exercise";
    document.getElementById("start-time").value = "";
    document.getElementById("end-time").value = "";

    // Hide the error messages
    const activityErrorText = document.getElementById("activity-name-error");
    activityErrorText.hidden = true; // Hide the error message

    const timeErrorText = document.getElementById("time-input-error");
    timeErrorText.hidden = true; // Hide the error message
}


function addScheduledActivity() {
    // Get the activity name, category, start time and end time from the form
    const activityName = document.getElementById("scheduled-activity-name").value;
    const category = document.getElementById("scheduled-category").value;
    const startTime = document.getElementById("scheduled-start-time").value;
    const endTime = document.getElementById("scheduled-end-time").value;
    const date = document.getElementById("scheduled-date").value;

    // Convert start/end times to minutes
    const startTimeMinutes = stringTimeToMinutes(startTime);
    const endTimeMinutes = stringTimeToMinutes(endTime);

    // Validate the inputs
    if (activityName.trim() === "") {
        const errorText = document.getElementById("scheduled-activity-name-error");
        errorText.hidden = false; // Show the error message
        return;
    }

    // Check if the times are valid
    if (startTime == "" || endTime == "" || startTime >= endTime) {
        const errorText = document.getElementById("scheduled-time-input-error");
        errorText.hidden = false; // Show the error message
        return;
    }

    // Check if the times are already occupied by an activity
    for (let i = 0; i < scheduledActivities.length; i++) {
        if (scheduledActivities[i].date == date && ((startTimeMinutes >= scheduledActivities[i].startTime && startTimeMinutes < scheduledActivities[i].endTime) || (endTimeMinutes > scheduledActivities[i].startTime && endTimeMinutes <= scheduledActivities[i].endTime))) {
            const errorText = document.getElementById("scheduled-time-input-error");
            errorText.hidden = false; // Show the error message
            console.log("Time already occupied by another scheduled activity");
            return;
        }
    }

    // Check if the date is valid
    let dateObj = new Date(date);
    console.log(dateObj.toString());
    if (dateObj.toString() === "Invalid Date") {
        const errorText = document.getElementById("scheduled-date-error");
        errorText.hidden = false; // Show the error message
        console.log("Invalid date");
        return;
    }

    // Convert the date to ISO string format
    const isoDate = getIsoString(dateObj);

    // Check if the date is in the past
    if (isoDate < getIsoString(new Date())) {
        const errorText = document.getElementById("scheduled-date-error");
        errorText.hidden = false; // Show the error message
        console.log("Date is in the past");
        return;
    }

    // Create a new scheduled activity object 
    const scheduledActivity = {
        title: activityName,
        category: category,
        startTime: startTimeMinutes,
        endTime: endTimeMinutes,
        date: isoDate
    };

    // Check if the date is in the current week
    if (isInWeek(firstDayOfWeek, dateObj)) {
        // Reset the date object
        dateObj = new Date(date);

        // Get the day of the week
        const dayOfWeek = (dateObj.getDay() + 6) % 7;

        // Add the block to the calendar
        addScheduledActivityBlock(activityName, category, startTimeMinutes, endTimeMinutes, dayOfWeek);
    }

    // Save to local storage
    saveScheduledActivity(scheduledActivity);

    // Save to the server
    saveScheduledActivityToServer(scheduledActivity);

    // Close the menu
    closeScheduledAddMenu();

    // Clear form inputs
    document.getElementById("scheduled-activity-name").value = "";
    document.getElementById("scheduled-category").value = "Work/Study";
    document.getElementById("scheduled-start-time").value = "";
    document.getElementById("scheduled-end-time").value = "";
    //document.getElementById("scheduled-date").value = ""; don't clear the date because it is needed for the next scheduled activity
    document.getElementById("scheduled-activity-name-error").hidden = true; // Hide the error message
    document.getElementById("scheduled-time-input-error").hidden = true; // Hide the error message
    document.getElementById("scheduled-date-error").hidden = true; // Hide the error message
}

async function stopActivity() {
    // Hide the stop button
    const stopButton = document.querySelector("#stop-button");
    stopButton.hidden = true;

    // Unhide the add button
    const addButton = document.querySelector("#add-button");
    addButton.hidden = false;

    // Get the current activity 
    const currentActivity = activities[currentActivityIndex];

    // Remove the running activity from the server 
    await removeCurrentlyRunningActivityFromServer();

    // If the activity has 0 duration, delete it and don't add to the server
    if (currentActivity.startTime == currentActivity.endTime) {
        // Remove activity from local storage
        activities.splice(currentActivityIndex, 1);
        localStorage.setItem("activities", JSON.stringify(activities));
    }
    else {
        // Save the activity to the server (so it is not running anymore)
        await saveActivityToServer(currentActivity);

        // Update the goal if there is one
        addTimeToGoal(currentActivity);
    }
    

    // Set the current activity index to -1 and update local storage
    currentActivityIndex = -1;
    localStorage.setItem("current_activity", currentActivityIndex);
    localStorage.removeItem("running_activity");


    // Reset the activity blocks
    removeActivityBlocks();
    loadActivities();
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

async function saveActivityToServer(activity) {
    // Check if authenticated
    const authStatus = await checkAuth();
    if (authStatus == true) {
        // Create an array
        const tempArray = [activity];

        // Convert to JSON
        const activityString = JSON.stringify(tempArray);

        // Send the request
        const activitiesResponse = await fetch("/api/activities", {
            method: "POST",
            body: activityString,
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",

            }
        });

        const activitiesData = await activitiesResponse.json();

        if (!activitiesResponse.ok ||!activitiesData.success) {
            // Send an alert that the activity was NOT posted to the server
            showToastNotification("Failed to post activity to the server. Check your network connection.");
        }
        else {
            //alert("Posted activity successfully");
            // Update the streak on the frontend
            const streakString = activitiesData.streak;

            // If the user has started a streak, display a toast notification
            if (streakString == "🔥1" && document.querySelector(".streak").textContent != streakString) {
                showToastNotification("You have started a streak! Keep it up! 🔥");
            }
            document.querySelector(".streak").textContent = streakString;
        }
    }
    else if (authStatus == false) {
        //alert("NOT AUTHENTICATED");
    }
}

async function saveRunningActivityToServer(activity) {
    // Check if authenticated
    const authStatus = await checkAuth();
    if (authStatus == true) {
        // Convert the activity to a JSON string
        const activityString = JSON.stringify(activity);

        // Send a POST request with the activity
        const activityResponse = await fetch("/api/activities/running", {
            method: "POST",
            body: activityString,
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }
        });

        const activityData = await activityResponse.json();

        if (!activityResponse.ok || !activityData.success) {
            // Send an alert that the activity was NOT posted to the server
            //alert("Failed to post running activity to the server. Check your network connection.");
        }
        else {
            //alert("Posted running activity successfully");
        }
    }
    else if (authStatus == false) {
        //alert("NOT AUTHENTICATED");
    }
}

async function saveScheduledActivityToServer(scheduledActivity) {
    // Check if authenticated
    const authStatus = await checkAuth();
    if (authStatus == true) {
        // Create an array
        const tempArray = [scheduledActivity];

        // Convert the scheduled activity to a JSON string
        const scheduledActivityString = JSON.stringify(tempArray);

        // Send a POST request with the scheduled activity
        const scheduledActivityResponse = await fetch("/api/scheduled-activities", {
            method: "POST",
            body: scheduledActivityString,
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }
        });

        const scheduledActivityData = await scheduledActivityResponse.json();

        if (!scheduledActivityResponse.ok || !scheduledActivityData.success) {
            // Send an alert that the scheduled activity was NOT posted to the server
            //alert("Failed to post scheduled activity to the server. Check your network connection.");
        }
        else {
            //alert("Posted scheduled activity successfully");
        }
    } else if (authStatus == false) {
        //alert("NOT AUTHENTICATED");
    }
}

async function saveScheduledActivitiesToServer(scheduledActivities) {
    // Check if authenticated
    const authStatus = await checkAuth();
    if (authStatus == true) {
        // Convert the scheduled activities to a JSON string
        const scheduledActivitiesString = JSON.stringify(scheduledActivities);

        // Send a POST request with the scheduled activities
        const scheduledActivitiesResponse = await fetch("/api/scheduled-activities", {
            method: "POST",
            body: scheduledActivitiesString,
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }
        });

        const scheduledActivitiesData = await scheduledActivitiesResponse.json();

        if (!scheduledActivitiesResponse.ok || !scheduledActivitiesData.success) {
            // Send an alert that the scheduled activities were NOT posted to the server
            //alert("Failed to post scheduled activities to the server. Check your network connection.");
        }
        else {
            //alert("Posted scheduled activities successfully");
        }
    } else if (authStatus == false) {
        //alert("NOT AUTHENTICATED");
    }
}

async function removeActivityFromServer(activity) {
    // Check if authenticated
    const authStatus = await checkAuth();
    if (authStatus == true) {
        // Send a POST request with the activity
        const activityString = JSON.stringify(activity);

        const activityResponse = await fetch("/api/activities/remove", {
            method: "POST",
            body: activityString,
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }
        })

        const activityData = await activityResponse.json();

        if (!activityResponse.ok ||!activityData.success) {
            // Send an alert that the activity was NOT posted to the server
            //alert("Failed to delete activity from server. Check your network connection.");
        }
        else {
            //alert("Deleted activity successfully");
            // Update the streak on the frontend
            const streakString = activityData.streak;
            document.querySelector(".streak").textContent = streakString;

            // If the user has lost their streak, display a toast notification
            if (streakString == "❄️0" && document.querySelector(".streak").textContent != streakString) {
                showToastNotification("You have lost your streak. Don't give up!");
            }

        }
    }
    else if (authStatus == false) {
        //alert("NOT AUTHENTICATED");
    }
}

async function removeScheduledActivityFromServer(scheduledActivity) {
    // Check if authenticated
    const authStatus = await checkAuth();
    if (authStatus == true) {
        // Convert the scheduled activity to a JSON string
        const scheduledActivityString = JSON.stringify(scheduledActivity);

        // Send a POST request with the scheduled activity
        const scheduledActivityResponse = await fetch("/api/scheduled-activities/remove", {
            method: "POST",
            body: scheduledActivityString,
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }
        });

        const scheduledActivityData = await scheduledActivityResponse.json();

        if (!scheduledActivityResponse.ok || !scheduledActivityData.success) {
            // Send an alert that the scheduled activity was NOT posted to the server
            //alert("Failed to delete scheduled activity from server. Check your network connection.");
        }
        else {
            //alert("Deleted scheduled activity successfully");
        }
    }
    else if (authStatus == false) {
        //alert("NOT AUTHENTICATED");
    }
}

async function addTimeToGoal(activity) {
    // Get the goal associated with the activity
    const goalsString = localStorage.getItem("goals");

    if (activity.goalName != "None" && goalsString != null) {
        const goals = JSON.parse(goalsString);

        for (let i = 0; i < goals.length; i++) {
            // If the goal corresponds to the activity and has NOT been completed already (or has been completed today)
            if (goals[i].title == activity.goalName && (goals[i].dateCompleted == "" || goals[i].dateCompleted == getIsoString(new Date()))) {
                // Goal has been found - update its time
                goals[i].timeDone += (activity.endTime - activity.startTime);

                // If the goal is complete, set the date completed
                if (goals[i].timeDone >= goals[i].duration) {
                    goals[i].dateCompleted = getIsoString(new Date());
                }

                // Update the goal server-side (if the user is authenticated)
                await updateGoalOnServer(goals[i]);

                // If the goal is complete, display a toast notification
                if (goals[i].timeDone >= goals[i].duration) {
                    showToastNotification(`Task '${goals[i].title}' completed! 🎉`);
                }
                else {
                    // Display a toast notification that the goal was updated
                    showToastNotification(`Task '${goals[i].title}' updated! Time done: ${goals[i].timeDone} minutes`);
                }

                break;
            }
        }

        // Save the goals list to local storage
        localStorage.setItem("goals", JSON.stringify(goals));
    }
}

// TODO
async function removeTimeFromGoal(goalName, activity) {
    // Iterate through goals
    const goalsString = localStorage.getItem("goals");

    if (goalsString) {
        const goals = JSON.parse(goalsString);

        for (let goal of goals) {
            if ((goal.title == goalName && activity.date == goal.date) || (goal.title == goalName && goal.dateCompleted == activity.date) || (goal.title == goalName && goal.dateCompleted == getIsoString(new Date()))) {
                // Remove the time from the goal
                goal.timeDone -= (activity.endTime - activity.startTime);

                // If the goal is no longer completed as a result, set dateCompleted to empty
                if (goal.timeDone < goal.duration) {
                    goal.dateCompleted = "";
                }

                // Update local storage
                localStorage.setItem("goals", goals);

                // Update goal server-side
                await updateGoalOnServer(goal);
            }
        }
    }
}

// Returns 0-6 for Monday-Sunday
function getCurrentDay() {
    // Get the current date
    const currentDate = new Date();

    // Get the day of the week (0-6, where 0 is Sunday and 6 is Saturday)
    let day = currentDate.getDay();

    // Adjust to make Monday = 0 and Sunday = 6
    day = (day + 6) % 7

    //console.log(day);
    return day; 
}

// Returns formatted date for calendar (e.g. Monday 08)
function getFormattedDate(date) {
    const options = { weekday: 'short', day: '2-digit' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    //console.log(formattedDate);
    return formattedDate;
}

function getIsoString(date) {
    // Get the date in YYYY-MM-DD format
    const isoString = date.toISOString().split('T')[0]; // Get the date part of the ISO string
    return isoString; 
}

function setDayHeadings(date) {
    // Get the first day of the week (Monday) for the current date
    const firstDayOfWeek = new Date(date.setDate(date.getDate() - date.getDay() + 1)); // Set the date to the first day of the week (Monday)

    // Get all day labels
    const dayLabels = document.querySelectorAll(".day");

    for (let i = 0; i < 7; i ++) {
        const day = new Date(firstDayOfWeek);

        // Set the date to the current day of the week
        day.setDate(firstDayOfWeek.getDate() + i); 

        // Get the formatted date for this day (e.g. Monday 08)
        const formattedDate = getFormattedDate(day); 

        // Set the text content of the day label
        dayLabels[i].textContent = formattedDate; 

        // If the day is today, highlight it in red
        if (i == getCurrentDay()) {
            dayLabels[i].style.color = "#f73a2d"; // Highlight the current day label in red
            //dayLabels[i].style.backgroundColor = "#e8f0fc"; // Highlight in light blue

            // If on mobile, centre
            if (isMobile()) {
                dayLabels[i].classList.add("current");
            }

        } 
        else {
            dayLabels[i].style.color = "#1e3a8a"; // Reset color for other days
            dayLabels[i].classList.remove("current");

            // If on mobile, remove other days
            if (isMobile()) {
                dayLabels[i].remove();
            }
        }
    }
}

function highlightCurrentDay() {
    // Get the current day of the week as a number
    const currentDay = getCurrentDay();

    // Get all day labels
    const dayLabels = document.querySelectorAll(".day");

    // Highlight the current day label in red
    dayLabels[currentDay].style.color = "red";
}

// Goes to the previous week 
function goToPreviousWeek() {
    // Get the first day of the previous week (this also updates the firstDayOfWeek global variable)
    const previousFirstDayOfWeek = new Date(firstDayOfWeek.setDate(firstDayOfWeek.getDate() - 7)); // Set the date to the first day of the week (Monday)

    // Update the calendar with the new date
    setMonthYear(previousFirstDayOfWeek);
    setDayHeadings(previousFirstDayOfWeek);

    // If the week is the current week
    if (previousFirstDayOfWeek.getTime() == firstDayOfCurrentWeek.getTime()) {
        // Highlight the current day label in red
        const dayLabels = document.querySelectorAll(".day");
        dayLabels[getCurrentDay()].style.color = "red"; 

        // Hide the next button
        //const nextButton = document.getElementById("next-button");
        //nextButton.hidden = true;

        // Colour the grid divs with the current day
        const gridDivs = document.querySelectorAll(".grid-item");

        for (let i = 0; i < gridDivs.length; i++) {
            if (i % 7 == getCurrentDay()) {
                gridDivs[i].classList.add("grid-item-today");
            }
        }

    }
    else {
        // Unhighlight the current day label
        const dayLabels = document.querySelectorAll(".day");
        dayLabels[getCurrentDay()].style.color = "#1e3a8a"; 

        // Uncolour the grid divs with the current day
        const gridDivs = document.querySelectorAll(".grid-item-today");
        if (gridDivs.length != 0) {
            for (let i = 0; i < gridDivs.length; i++) {
                gridDivs[i].classList.remove("grid-item-today");
            }
        }
    }

    // Reset displayed activities by removing all blocks and then reloading (first checking if logged activities are shown)
    if (canShowLogged()) {
        removeActivityBlocks();
        loadActivities();
    }

    // Reset scheduled activities
    if (canShowScheduled()) {
        removeScheduledActivityBlocks();
        loadScheduledActivities();
    }
}

// Goes to the next week
function goToNextWeek() {
    // Get the first day of the next week (this also updates the firstDayOfWeek global variable)
    const nextFirstDayOfWeek = new Date(firstDayOfWeek.setDate(firstDayOfWeek.getDate() + 7)); // Set the date to the first day of the week (Monday)

    // Update the calendar with the new date
    setMonthYear(nextFirstDayOfWeek);
    setDayHeadings(nextFirstDayOfWeek);

    // If the week is the current week
    if (nextFirstDayOfWeek.getTime() == firstDayOfCurrentWeek.getTime()) {
        // Highlight the current day label in red
        const dayLabels = document.querySelectorAll(".day");
        dayLabels[getCurrentDay()].style.color = "red"; 

        // Hide the next button
        //const nextButton = document.getElementById("next-button");
        //nextButton.hidden = true;

        // Colour the grid divs with the current day
        const gridDivs = document.querySelectorAll(".grid-item");

        for (let i = 0; i < gridDivs.length; i++) {
            if (i % 7 == getCurrentDay()) {
                gridDivs[i].classList.add("grid-item-today");
            }
        }

    }
    else {
        // Unhighlight the current day label
        const dayLabels = document.querySelectorAll(".day");
        dayLabels[getCurrentDay()].style.color = "#1e3a8a"; 

        // Uncolour the grid divs with the current day
        const gridDivs = document.querySelectorAll(".grid-item-today");
        if (gridDivs.length != 0) {
            for (let i = 0; i < gridDivs.length; i++) {
                gridDivs[i].classList.remove("grid-item-today");
            }
        }
    }

    // Reset displayed activities by removing all blocks and then reloading
    if (canShowLogged()) {
        removeActivityBlocks();
        loadActivities();
    }

    // Reset scheduled activities
    if (canShowScheduled()) {
        removeScheduledActivityBlocks();
        loadScheduledActivities();
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
    }
    else {
        // Goal has been updated successfully
        // Idk what to do here lol
    }
}


// startTime and endTime are FLOATS (e.g. 8.5 for 08:30)
function addBlock(title, category, startTime, endTime, day, ongoing) {


    const calendarGrid = document.querySelector(".calendar-grid");
    const gridItems = calendarGrid.querySelectorAll(".grid-item");

    // Get the height of a grid row
    //const gridRowHeight = gridItems[0].offsetHeight; 
    const gridRowHeight = calendarGrid.offsetHeight / 24;

    // Get the width of a grid column
    const gridColumnWidth = gridItems[0].offsetWidth;
    //const gridColumnWidth = gridItems[0].clientWidth;

    // Create a new block
    const block = document.createElement("div");
    block.classList.add("block");
    block.classList.add("prevent-select");

    // If the activity is ongoing, set the block to be flashing
    if (ongoing) {
        block.classList.add("flash");
    }

    // Show/hide delete button on hover
    block.onmouseover = function() {
        // Show the delete button when hovering over the block
        const deleteButton = block.querySelector("button"); /* Didn't know you could do this lol */
        deleteButton.hidden = false;

        // Show the time when hovering over the block
        const timeLabel = block.querySelector(".block-time");
        timeLabel.hidden = false;
    }
    block.onmouseout = function() {
        // Hide the delete button when not hovering over the block
        const deleteButton = block.querySelector("button");
        deleteButton.hidden = true;

        // Hide the time when not hovering over the block
        const timeLabel = block.querySelector(".block-time");
        timeLabel.hidden = true;
    }

    
    block.onclick = function() {
        // Set the edited block
        editedBlock = block;

        // Open the edit menu
        openEditMenu(title, category, startTime, endTime, day, ongoing);
    }

    // Create a delete button for the block
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "×";
    deleteButton.onclick = async function(event) {
        // Stop event bubbling up to parent (block)
        event.stopPropagation();

        // Delete the actual block HTML element
        block.remove();

        // Remove the activity from the activities array
        for (let i = 0; i < activities.length; i++) {
            if (activities[i].title == title && activities[i].startTime == startTime && activities[i].endTime == endTime) {
                // Find the goal
                if (activities[i].goalName != "None") {
                    // Load goals
                    const goalsString = localStorage.getItem("goals");
                    if (goalsString) {
                        const goals = JSON.parse(goalsString);

                        for (let j = 0; j < goals.length; j++) {
                            if (goals[j].title == activities[i].goalName && goals[j].date == activities[i].date) {
                                // Remove the activity's time from the goal
                                goals[j].timeDone -= (activities[i].endTime - activities[i].startTime);

                                // Save to local storage
                                localStorage.setItem("goals", JSON.stringify(goals));

                                // Update the goal on the server
                                await updateGoalOnServer(goals[j]);

                            }
                        }
                    }
                }
                // If the activity is currently running, reset the index 
                if (i == currentActivityIndex) {
                    currentActivityIndex = -1;
                    localStorage.setItem("current_activity", -1);

                    localStorage.removeItem("running_activity");

                    // Hide the stop button and show the add button (at the top of the page)
                    const addButton = document.querySelector("#add-button");
                    const stopButton = document.querySelector("#stop-button");

                    addButton.hidden = false;
                    stopButton.hidden = true;

                    // Remove the running activity from the server
                    await removeCurrentlyRunningActivityFromServer();
                }
                // If not, remove the activity from the server
                else {
                    // Remove the activity from the server
                    await removeActivityFromServer(activities[i]);
                }

                // Remove the activity itself
                activities.splice(i, 1); // Removes one item from the array at index i

                break;
            }

        }
        // Update local storage
        localStorage.setItem("activities", JSON.stringify(activities));

    }

    // Hide the delete button for now
    deleteButton.hidden = true; 

    // Create a text label for the block
    const blockText = document.createElement("span");
    blockText.classList.add("block-text");
    blockText.textContent = title; 

    // Create a time label for the block
    const blockTime = document.createElement("span");
    blockTime.classList.add("block-time");
    blockTime.textContent = endTime - startTime + "m";
    blockTime.hidden = true;

    // Add the delete button, the text label and the time label to the block
    block.appendChild(deleteButton);
    block.appendChild(blockText);
    block.appendChild(blockTime);

    //block.textContent = title;

    // Calculate width of block - this is the width of a grid column - and make it slightly smaller to add a margin
    const blockWidth = gridColumnWidth * 0.95;

    // Calculate height of block - this is the height a grid row multiplied by the end time minus the start time (in hours)
    //const blockHeight = gridRowHeight * (endTime - startTime);
    const blockHeight = gridRowHeight * (endTime - startTime) / 60;

    // Calculate x position of block - this is the current day of the week (0-6) multiplied by the width of a grid column and add a margin
    let xPosition = (day * gridColumnWidth) + (gridColumnWidth * 0.025);

    // If on mobile, the x position is just 0 plus the margin'
    if (isMobile()) {
        // Set the x position to 0 plus the margin
        xPosition = (gridColumnWidth * 0.025);
    }

    // Calculate y position of block - this is the start time of the activity (in hours) multiplied by the height of a grid row
    //const yPosition = startTime * gridRowHeight;
    const yPosition = (startTime * gridRowHeight) / 60; 

    // Set the position of the block
    block.style.position = "absolute"; // Set the position to absolute 
    block.style.width = blockWidth + "px";
    block.style.height = blockHeight + "px";
    block.style.top = yPosition + "px"; 
    block.style.left = xPosition + "px";

    // Set the background colour of the block
    switch(category) {
        case "Work/Study":
            block.style.backgroundColor = "#3B82F6"; // Blue
            break;
        case "Exercise":
            block.style.backgroundColor = "#FF6B35"; // Orange
            break;
        case "Social":
            block.style.backgroundColor = "#8B5CF6"; // Purple
            break;
        case "Chores/Errands":
            block.style.backgroundColor = "#D6A85D"; // Yellow/tan
            break;
        case "Eat/Drink":
            block.style.backgroundColor = "#F97316"; // Orange
            break;
        case "Leisure":
            block.style.backgroundColor = "#22C55E"; // Green
            break;
        case "Wasted time":
            block.style.backgroundColor = "#991B1B"; // Crimson
            break;
        case "Personal care":
            block.style.backgroundColor = "#A7F3D0"; // Mint green
            break;
        case "Sleep/Napping":
            block.style.backgroundColor = "#1E3A8A"; // Midnight blue
            break;
        case "Travel":
            block.style.backgroundColor = "#60A5FA"; // Light blue
            break;
        case "Planning/Reflection":
            block.style.backgroundColor = "#14B8A6"; // Teal
            break;
        case "Other":
            block.style.backgroundColor = "#9CA3AF"; // Grey
            break;
        default:
            block.style.backgroundColor = "#9CA3AF"; // Grey
            break;
        
    }

    // Add the block to the calendar grid
    calendarGrid.appendChild(block);
}

function rgbToRgba(rgb, alpha) {
    // rgb: "rgb(r, g, b)" or "rgba(r, g, b, a)"
    // alpha: 0.0 - 1.0
    let parts = rgb.match(/\d+/g);
    if (!parts) return rgb;
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

function addScheduledActivityBlock(title, category, startTime, endTime, day, suggested = false) {
    const calendarGrid = document.querySelector(".calendar-grid");
    const gridItems = calendarGrid.querySelectorAll(".grid-item");

    // Get the height of a grid row
    //const gridRowHeight = gridItems[0].offsetHeight; 
    const gridRowHeight = calendarGrid.offsetHeight / 24;

    // Get the width of a grid column
    const gridColumnWidth = gridItems[0].offsetWidth;
    //const gridColumnWidth = gridItems[0].clientWidth;

    // Create a new block
    const block = document.createElement("div");
    block.classList.add("scheduled-block");
    block.classList.add("prevent-select");
    block.setAttribute("data-category", category); 
    block.setAttribute("data-day", day);
    block.setAttribute("data-start-time", startTime);
    block.setAttribute("data-end-time", endTime);

    // Create a text label for the block
    const blockText = document.createElement("span");
    blockText.classList.add("scheduled-block-text");
    blockText.textContent = title;

    // Create a time label for the block
    const blockTime = document.createElement("span");
    blockTime.classList.add("scheduled-block-time");
    blockTime.textContent = getTimeFromMinutes(startTime) + " - " + getTimeFromMinutes(endTime);
    blockTime.hidden = true; 

    // Create a delete button for the block
    const deleteButton = document.createElement("button");
    
    deleteButton.textContent = "×";
    deleteButton.onclick = function() {
        calendarGrid.removeChild(block);

        // Remove from scheduled activities array
        for (let i = 0; i < scheduledActivities.length; i++) {
            // TODO: Include date in the check
            if (scheduledActivities[i].title == title && scheduledActivities[i].startTime == startTime && scheduledActivities[i].endTime == endTime) {
                // Remove the scheduled activity from the server
                removeScheduledActivityFromServer(scheduledActivities[i]);

                // Remove the activity from the scheduled activities array
                scheduledActivities.splice(i, 1); // Removes one item from the array at index i

                // Update local storage
                localStorage.setItem("scheduled_activities", JSON.stringify(scheduledActivities));

                break;
            }
        }
    };

    // Hide the delete button for now
    deleteButton.hidden = true;

    // Show/hide delete button on hover
    block.onmouseover = function() {
        // Show the delete button when hovering over the block
        deleteButton.hidden = false;

        // Show the time when hovering over the block
        blockTime.hidden = false;

        // Change the background colour of the block to the same as the border colour and the text colour to white
        block.style.backgroundColor = rgbToRgba(block.style.borderColor, 0.5);
        blockText.style.color = "#FFFFFF"; 
    }

    block.onmouseout = function() {
        // Hide the delete button when not hovering over the block
        deleteButton.hidden = true;

        // Hide the time when not hovering over the block
        blockTime.hidden = true;

        // Change the background colour of the block to transparent and the text colour to the border colour
        block.style.backgroundColor = "transparent";
        blockText.style.color = block.style.borderColor;
    }

    // Calculate width of block - this is the width of a grid column
    const blockWidth = gridColumnWidth;

    // Calculate height of block - this is the height a grid row multiplied by the end time minus the start time (in hours)
    //const blockHeight = gridRowHeight * (endTime - startTime);
    const blockHeight = gridRowHeight * (endTime - startTime) / 60;

    // Calculate x position of block - this is the current day of the week (0-6) multiplied by the width of a grid column 
    let xPosition = (day * gridColumnWidth);

    // If on mobile, the x position is just 0
    if (isMobile()) {
        // Set the x position to 0 
        xPosition = 0;
    }

    // Calculate y position of block - this is the start time of the activity (in hours) multiplied by the height of a grid row
    //const yPosition = startTime * gridRowHeight;
    const yPosition = (startTime * gridRowHeight) / 60; 

    // Set the position of the block
    block.style.position = "absolute"; // Set the position to absolute 
    block.style.width = blockWidth + "px";
    block.style.height = blockHeight + "px";
    block.style.top = yPosition + "px"; 
    block.style.left = xPosition + "px";

    // Set the background colour of the block
    switch(category) {
        case "Work/Study":
            block.style.borderColor = "#3B82F6"; // Blue
            block.style.color = "#3B82F6"; // Blue
            blockText.style.color = "#3B82F6"; // Blue
            break;
        case "Exercise":
            block.style.borderColor = "#FF6B35"; // Orange
            block.style.color = "#FF6B35"; // Orange
            blockText.style.color = "#FF6B35"; // Orange
            break;
        case "Social":
            block.style.borderColor = "#8B5CF6"; // Purple
            block.style.color = "#8B5CF6"; // Purple
            blockText.style.color = "#8B5CF6"; // Purple
            break;
        case "Chores/Errands":
            block.style.borderColor = "#D6A85D"; // Yellow/tan
            block.style.color = "#D6A85D"; // Yellow/tan
            blockText.style.color = "#D6A85D"; // Yellow/tan
            break;
        case "Eat/Drink":
            block.style.borderColor = "#F97316"; // Orange
            block.style.color = "#F97316"; // Orange
            blockText.style.color = "#F97316"; // Orange
            break;
        case "Leisure":
            block.style.borderColor = "#22C55E"; // Green
            block.style.color = "#22C55E"; // Green
            blockText.style.color = "#22C55E"; // Green
            break;
        case "Wasted time":
            block.style.borderColor = "#991B1B"; // Crimson
            block.style.color = "#991B1B"; // Crimson
            blockText.style.color = "#991B1B"; // Crimson
            break;
        case "Personal care":
            block.style.borderColor = "#A7F3D0"; // Mint green
            block.style.color = "#A7F3D0"; // Mint green
            blockText.style.color = "#A7F3D0"; // Mint green
            break;
        case "Sleep/Napping":
            block.style.borderColor = "#1E3A8A"; // Midnight blue
            block.style.color = "#1E3A8A"; // Midnight blue
            blockText.style.color = "#1E3A8A"; // Midnight blue
            break;
        case "Travel":
            block.style.borderColor = "#60A5FA"; // Light blue
            block.style.color = "#60A5FA"; // Light blue
            blockText.style.color = "#60A5FA"; // Light blue
            break;
        case "Planning/Reflection":
            block.style.borderColor = "#14B8A6"; // Teal
            block.style.color = "#14B8A6"; // Teal
            blockText.style.color = "#14B8A6"; // Teal
            break;
        case "Other":
            block.style.borderColor = "#9CA3AF"; // Grey
            block.style.color = "#9CA3AF"; // Grey
            blockText.style.color = "#9CA3AF"; // Grey
            break;
        default:
            block.style.borderColor = "#9CA3AF"; // Grey
            block.style.color = "#9CA3AF"; // Grey
            blockText.style.color = "#9CA3AF"; // Grey
            break;
        
    }

    // Add the text label and the delete button to the block
    block.appendChild(blockText);
    block.appendChild(blockTime);

    // Only add the delete button if the block is not a suggested activity
    if (!suggested) {
        block.appendChild(deleteButton);
    }

    // If the block is a suggested activity make it slightly transparent and remove the delete button
    if (suggested == true) {
        block.classList.add("suggested-scheduled-block");
        deleteButton.remove();
    }

    // Add the block to the calendar grid
    calendarGrid.appendChild(block);
}

function getTimeFromMinutes(minutes) {
    // Convert minutes to hours and minutes
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    // Format the time as HH:MM
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;

    return formattedTime;
}

// Gets inputs from edit menu to edit an activity
async function editActivity() {
    // Get inputs (use value rather than textcontent for inputs)
    const name = document.querySelector("#edit-activity-name").value;
    const category = document.querySelector("#edit-category").value;
    const startTime = document.querySelector("#edit-start-time").value;
    const endTime = document.querySelector("#edit-end-time").value;
    const goalName = document.querySelector("#edit-link-to-goal").value;

    // Convert times to minutes
    const startTimeMinutes = stringTimeToMinutes(startTime);
    const endTimeMinutes = stringTimeToMinutes(endTime);

    // Validate inputs
    if (name.trim() === "") {
        document.querySelector("#edit-activity-name-error").hidden = false;
        return;
    }

    // Check if the times are valid
    if (isNaN(startTimeMinutes) || isNaN(endTimeMinutes) || startTimeMinutes >= endTimeMinutes) {
        document.querySelector("#edit-time-input-error").hidden = false;
        return;
    }
    
    // Check if the times are already occupied by an activity and return an error message if so
    for (let i = 0; i < activities.length; i++) {
        if (editedActivityIndex != i && (activities[i].date == getIsoString(new Date()) && ((startTimeMinutes >= activities[i].startTime && startTimeMinutes < activities[i].endTime) || (endTimeMinutes > activities[i].startTime && endTimeMinutes <= activities[i].endTime)))) {
            const errorText = document.getElementById("edit-time-input-error");
            errorText.hidden = false; // Show the error message

            return;
        }
    }

    // Edit the activity in the activities array
    const dateString = activities[editedActivityIndex].date;

    let editedActivity = {
        title: name, 
        category: category,
        startTime: startTimeMinutes,
        endTime: endTimeMinutes,
        date: dateString,
        goalName: goalName
    }

    activities[editedActivityIndex] = editedActivity;

    // Update local storage
    localStorage.setItem("activities", JSON.stringify(activities));
    if (editedActivityIndex  == currentActivityIndex) {
        localStorage.setItem("running_activity", JSON.stringify(editedActivity));
    }

    // Update the activity server-side
    if (editedActivityId != -1) {
        await updateActivityOnServer(editedActivity);
    }

    // Update the goal if it has been changed
    if (prevGoal != goalName) {
        // Remove time from the previous goal
        await removeTimeFromGoal(prevGoal, editedActivity);

        // Add time to the new goal
        if (goalName != "None") {
            await addTimeToGoal(editedActivity);
        }
    }

    

    //removeActivityBlocks();
    //loadActivities();
    // Get the day for the block
    const day = ((new Date(dateString)).getDay() + 6) % 7;

    // Replace the existing block
    addBlock(name, category, startTimeMinutes, endTimeMinutes, day);
    editedBlock.remove();

    closeEditMenu();

}

function openAddMenu() {
    // Make sure the start time is correct if the checkbox is checked
    onStartNowCheckboxChange();

    // Unhide the menu
    const addMenu = document.querySelector("#add-activity-menu");
    addMenu.hidden = false;

    // Populate the goal select menu with a list of current goals
    const selectMenu = addMenu.querySelector("#link-to-goal");

    // Remove all existing select options
    selectMenu.textContent = "";

    const noneOption = document.createElement("option");
    noneOption.value = "None";
    noneOption.textContent = "None";
    selectMenu.appendChild(noneOption);

    const goalsString = localStorage.getItem("goals");
    if (goalsString != null) {
        const goals = JSON.parse(goalsString);
        for (let i = 0; i < goals.length; i++) {
            // If the goal is on the current day or in the future, or if it is not completed, add its name as an option
            if (goals[i].date >= getIsoString(new Date()) || goals[i].dateCompleted == "") {
                const goalOption = document.createElement("option");
                goalOption.value = goals[i].title;
                goalOption.textContent = goals[i].title;
                
                selectMenu.appendChild(goalOption);
            }
        }
    }
}

function openScheduledAddMenu() {
    // Unhide the menu
    const addMenu = document.querySelector("#add-scheduled-activity-menu");
    addMenu.hidden = false;
}

function openEditMenu(title, category, startTime, endTime, day, ongoing) {
    // Get the menu
    const editMenu = document.querySelector("#edit-activity-menu");
    
    // If the menu is already unhidden, do nothing
    if (!editMenu.hidden) {
        return;
    }

    // Get the form inputs
    const nameInput = document.querySelector("#edit-activity-name");
    const categoryInput = document.querySelector("#edit-category");
    const startTimeInput = document.querySelector("#edit-start-time");
    const endTimeInput = document.querySelector("#edit-end-time");
    const goalInput = document.querySelector("#edit-link-to-goal");

    // Fill in the menu with the activity info
    nameInput.value = title;
    categoryInput.value = category;
    startTimeInput.value = getTimeFromMinutes(startTime);
    endTimeInput.value = getTimeFromMinutes(endTime);

    // Populate goal select menu with a list of current goals (and None option)
    let goalName = "None";

    // First get the current goal
    for (let i = 0; i < activities.length; i++ ) {
        const currentActivity = activities[i];
        const currentActivityDate = new Date(currentActivity.date);
        if (currentActivity.title == title && currentActivity.category == category && currentActivity.startTime == startTime && currentActivity.endTime == endTime && (currentActivityDate.getDay() + 6) % 7 == day && isInWeek(firstDayOfWeek, currentActivityDate)) {
            if (currentActivity.goalName) {
                goalName = currentActivity.goalName;
            }
        }
    }

    // Add the activity's current goal as the first option
    const firstOption = document.createElement("option");
    firstOption.value = goalName;
    firstOption.textContent = goalName;
    goalInput.appendChild(firstOption);

    const goalsString = localStorage.getItem("goals");
    if (goalsString != null) {
        const goals = JSON.parse(goalsString);
        for (let i = 0; i < goals.length; i++) {
            // If the goal is on the current day or in the future, or if it is not completed, add it as an option (but not if current goal)
            if (goals[i].date >= getIsoString(new Date()) || goals[i].dateCompleted == "" && goals[i].title != goalName) {
                const goalOption = document.createElement("option");
                goalOption.value = goals[i].title;
                goalOption.textContent = goals[i].title;
                
                goalInput.appendChild(goalOption);
            }
        }
    }

    // If there is not a None option, add one
    if (goalName != "None") {
        const noneOption = document.createElement("option");
        noneOption.value = "None";
        noneOption.textContent = "None";
        goalInput.appendChild(noneOption);
    }

    // If the activity is ongoing, disable time inputs
    if (ongoing) {
        startTimeInput.disabled = true;
        endTimeInput.disabled = true;
    }
    else {
        startTimeInput.disabled = false;
        endTimeInput.disabled = false;
    }

    // Set the currently edited activity index
    setEditedActivityIndex(title, category, startTime, endTime, day);

    // Set the activity id (if the user is logged in)
    setEditedActivityId(title, category, startTime, endTime, day);

    // Set the previous goal name
    prevGoal = goalInput.value;

    // Unhide the menu
    editMenu.hidden = false;
}

function setEditedActivityIndex(title, category, startTime, endTime, day) {

    // Iterate through all activities in the activities array
    for (let i = 0; i < activities.length; i++) {
        const currentActivity = activities[i];
        const currentActivityDate = new Date(currentActivity.date);
        if (currentActivity.title == title && currentActivity.category == category && currentActivity.startTime == startTime && currentActivity.endTime == endTime && (currentActivityDate.getDay() + 6) % 7 == day && isInWeek(firstDayOfWeek, currentActivityDate)) {
            
            // Edit the edited activity index (activity has been found)
            editedActivityIndex = i;
            console.log("Edited index: " + editedActivityIndex);

            break;
        }
    }
}

async function setEditedActivityId(title, category, startTime, endTime, day) {
    // Authenticate the user
    const authResponse = await checkAuth();

    if (authResponse == false) {
        return;
    }

    // Get the activity from the activities array
    let activity = null;

    // Iterate through all activities in the activities array
    for (let i = 0; i < activities.length; i++) {
        const currentActivity = activities[i];
        const currentActivityDate = new Date(currentActivity.date);
        if (currentActivity.title == title && currentActivity.category == category && currentActivity.startTime == startTime && currentActivity.endTime == endTime && (currentActivityDate.getDay() + 6) % 7 == day && isInWeek(firstDayOfWeek, currentActivityDate)) {
            activity = activities[i];

        }
    }

    // If the activity is not found
    if (activity === null) {
        return;
    }

    // Fetch the id from the server
    const idResponse = await fetch("/api/activities/id", {
        method: "POST",
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(activity)
    })
    const idData = await idResponse.json();

    if (idResponse.ok && idData.id) {
        // Set the id
        editedActivityId = idData.id;
        console.log("ID: " + editedActivityId);
    }
}

function closeAddMenu() {
    // Hide the menu
    const addMenu = document.querySelector(".add-menu");
    addMenu.hidden = true; 
}

function closeScheduledAddMenu() {
    // Hide the menu
    const addMenu = document.querySelector("#add-scheduled-activity-menu");
    addMenu.hidden = true;
}

function closeEditMenu() {
    // Hide the menu
    const editMenu = document.querySelector("#edit-activity-menu");
    editMenu.hidden = true;

    // Clear the goal options
    const goalSelectMenu = document.querySelector("#edit-link-to-goal");
    goalSelectMenu.textContent = "";

    // Reset the edited activity index
    editedActivityIndex = -1;

    // Reset the edited activity id
    editedActivityId = -1;

    // Reset the previous goal
    prevGoal = "None";

    // Reset the edited block 
    editedBlock = null;
}

function onStartNowCheckboxChange() {
    const startNowCheckbox = document.getElementById("start-now");
    const startTimeInput = document.getElementById("start-time");
    const endTimeInput = document.getElementById("end-time");

    // If the checkbox is checked, disable the start time input and set the value to the current time
    if (startNowCheckbox.checked) {
        // Disable the start time input
        startTimeInput.disabled = true;
        
        // Disable the end time input
        endTimeInput.disabled = true;

        const currentTime = new Date(); 
        const hours = String(currentTime.getHours()).padStart(2, '0'); // Get the current hours and pad with leading zero if needed
        const minutes = String(currentTime.getMinutes()).padStart(2, '0'); // Get the current minutes and pad with leading zero if needed
        startTimeInput.value = `${hours}:${minutes}`; // Set the value of the start time input to the current time

        // Set the end time input to blank
        endTimeInput.value = "";
    } else {
        // Enable the start time input
        startTimeInput.disabled = false; 

        // Enable the end time input
        endTimeInput.disabled = false;
        
        // Clear the value of the start time input
        startTimeInput.value = "";
    }
}

function stringTimeToFloat(timeString) {
    let timeFloat = 0.0;

    // Split the time string into hours and minutes
    const timeParts = timeString.split(":"); 

    const hours = parseFloat(timeParts[0]);
    const minutes = parseFloat(timeParts[1]);

    timeFloat = hours + (minutes / 60); 

    console.log("Time string: " + timeString + ", Time float: " + timeFloat); // Log the time string and time float

    return timeFloat;
}

function stringTimeToMinutes(timeString) {
    let timeMinutes = 0;

    // Split the time string into hours and minutes
    const timeParts = timeString.split(":");

    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);

    timeMinutes = (hours * 60) + minutes;

    console.log("Time string: " + timeString + ", Time minutes: " + timeMinutes); // Log the time string and time float

    return timeMinutes;
}

// Temporary function to migrate from float times in hours to int times in minutes
/*
function migrateActivities() {
    //return Math.floor(timeFloat * 60); 
    for (let i = 0; i < activities.length; i++) {
        activities[i].startTime = Math.floor(activities[i].startTime * 60); // Convert to minutes
        activities[i].endTime = Math.floor(activities[i].endTime * 60); // Convert to minutes
    }

    localStorage.setItem("activities", JSON.stringify(activities)); // Save the activities to local storage
}*/



async function loadActivities() {
    console.log("foo");

    // Load activities from local storage
    const activitiesString = localStorage.getItem("activities");

    const runningActivityString = localStorage.getItem("running_activity");

    // Set the current activity index to the one stored 
    currentActivityIndex = parseInt(localStorage.getItem("current_activity"));

    // If there is no index stored, make it equal to -1
    if (isNaN(currentActivityIndex)) {
        currentActivityIndex = -1;
        localStorage.setItem("current_activity", currentActivityIndex);
    }
    console.log("Current activity index: " + currentActivityIndex);

    // Check if there are any activities saved first
    if (activitiesString) {
        activities = JSON.parse(activitiesString);

        // ONLY DO THIS IF THE USER IS LOGGED IN
        if (runningActivityString && await checkAuth() == true && initialPageLoad == true) {
            // If there is a running activity, add it to the activities array
            // This is because running activities are not saved to the server until they are stopped
            // and are only saved to local storage
            console.log("FAT BASTARD");
            activities.push(JSON.parse(runningActivityString));

            // Set the current activity index to the last activity in the array
            currentActivityIndex = activities.length - 1;

            // Save to local storage again
            localStorage.setItem("activities", JSON.stringify(activities));
            localStorage.setItem("current_activity", currentActivityIndex);
        }

        // Iterate through every saved activity
        for (let i = 0; i < activities.length; i++) {
            // If an activity is in the current week, add it to the calendar
            const activity = activities[i];

            // Get the date of the activity
            let activityDate = new Date(activity.date);

            // If the activity is in the current week, add it to the calendar
            if (isInWeek(firstDayOfWeek, activityDate)) {
                //console.log("Activity in current week: " + activity.title); 

                // Get the date of the activity again - it's being modified so change this shit later
                activityDate = new Date(activity.date);

                // Get the day from the activity date and adjust to make Monday = 0 and Sunday = 6
                let activityDay = activityDate.getDay(); 
                activityDay = (activityDay + 6) % 7;

                // Add the block to the calendar

                // If the activity is the current activity, add the block with ongoing=true
                if (i == currentActivityIndex) {
                    addBlock(activity.title, activity.category, activity.startTime, activity.endTime, activityDay, true);
                }
                // If the activity is not the current activity, add the block with no flash
                else {
                    // If on mobile, only add activities for the current day
                    if (isMobile()) {
                        if (activityDay == getCurrentDay()) {
                            addBlock(activity.title, activity.category, activity.startTime, activity.endTime, activityDay, false);
                        }
                    }
                    else {
                        addBlock(activity.title, activity.category, activity.startTime, activity.endTime, activityDay, false);
                    }
                }
                
            }
        }
    }

    //console.log(activitiesString);
    //console.log(activities);
}

function loadScheduledActivities() {
    // Load scheduled activities from local storage
    const scheduledActivitiesString = localStorage.getItem("scheduled_activities");

    if (scheduledActivitiesString) {
        scheduledActivities = JSON.parse(scheduledActivitiesString);

        // Add blocks
        for (let i = 0; i < scheduledActivities.length; i++) {
            const scheduledActivity = scheduledActivities[i];

            let scheduledActivityDateObj = new Date(scheduledActivity.date);

            // Check if the scheduled activity is in the current week
            if (isInWeek(firstDayOfWeek, scheduledActivityDateObj)) {
                // Reset the date object
                scheduledActivityDateObj = new Date(scheduledActivity.date);

                // Get the day
                const scheduledActivityDay = (scheduledActivityDateObj.getDay() + 6) % 7;

                // If on mobile, only add scheduled activities for the current day
                if (isMobile()) {
                    if (scheduledActivity.date == getIsoString(new Date())) {
                        // Add the block
                        addScheduledActivityBlock(scheduledActivity.title, scheduledActivity.category, scheduledActivity.startTime, scheduledActivity.endTime, scheduledActivityDay);
                    }
                }
                else {
                    // Add the block to the calendar
                    addScheduledActivityBlock(scheduledActivity.title, scheduledActivity.category, scheduledActivity.startTime, scheduledActivity.endTime, scheduledActivityDay);
                }
            }
        }
    }
}

function hasGoalsFromToday() {
    // Check if there are any goals for today
    const goalsString = localStorage.getItem("goals");
    if (goalsString) {
        const goals = JSON.parse(goalsString);
        for (let i = 0; i < goals.length; i++) {
            if (goals[i].date == getIsoString(new Date())) {
                return true;
            }
        }
    }
    return false;
}

async function openGenerateScheduleMenu() {
    // Check if the user is logged in
    if (await checkAuth() == false) {
        // Redirect to the login page
        window.location.href = "/login";
        return;
    }

    document.querySelector("#generate-schedule-menu").hidden = false; 

    // Clear time inputs
    document.querySelector("#generate-schedule-start-time").value = "";
    document.querySelector("#generate-schedule-end-time").value = "";

    // Clear any existing error messages
    document.querySelector("#generate-schedule-time-input-error").hidden = true;
}

function closeGenerateScheduleMenu() {
    document.querySelector("#generate-schedule-menu").hidden = true;

    // Clear time inputs
    //document.querySelector("#generate-schedule-start-time").value = "";
    //document.querySelector("#generate-schedule-end-time").value = "";

    // DON'T DO THIS BECAUSE THEY'RE NEEDED FOR REFRESHING THE SCHEDULE
}
 
async function generateSchedule() {
    // Check start time and end time inputs
    const startTime = document.querySelector("#generate-schedule-start-time").value;
    const endTime = document.querySelector("#generate-schedule-end-time").value;

    // Convert to minutes format
    const startTimeMinutes = stringTimeToMinutes(startTime);
    const endTimeMinutes = stringTimeToMinutes(endTime);

    if (startTime == "" || endTime == "" || startTimeMinutes >= endTimeMinutes) {
        // Show an error message
        document.querySelector("#generate-schedule-time-input-error").hidden = false;
        return;
    }

    // Close the generate schedule menu
    closeGenerateScheduleMenu();

    // If a request has already been sent, do not send another one
    const loadingScreen = document.querySelector("#generate-schedule-loading-screen");
    if (loadingScreen.style.display == "flex") {
        return;
    }

    // If the user has no tasks, prompt them to add some
    const goalsString = localStorage.getItem("goals");
    if (!goalsString || !hasGoalsFromToday()) {
        showToastNotification("⚠️ No tasks for today found. Please add some tasks to generate a schedule. ⚠️");
        return;
    }

    // If the user has no scheduled activities, prompt them to add some
    //if (scheduledActivities.length == 0) {
        //showToastNotification("⚠️ No scheduled activities for today found. Please add some scheduled activities to generate a schedule. ⚠️");
        //return;
    //}

    // Show the loading screen
    loadingScreen.style.display = "flex";

    // Clear any existing suggested activities
    suggestedScheduledActivities = [];

    // Send a request to the server to generate suggested activities
    const scheduleResponse = await fetch("/api/account/generate-schedule", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({
            date: getIsoString(new Date()),
            startTime: startTimeMinutes,
            endTime: endTimeMinutes
        })
    });

    const scheduleData = await scheduleResponse.json();

    if (scheduleResponse.ok && scheduleData.success == true) {
        console.log(scheduleData.schedule);
        suggestedScheduledActivities = JSON.parse(scheduleData.schedule);
        console.log("Suggested activities: ", suggestedScheduledActivities); // Log the suggested activities

    }

    // Display the suggested activities
    showSuggestedActivities();

    // Show the confirm/refresh/cancel buttons
    document.querySelector("#confirm-schedule-button").hidden = false;
    document.querySelector("#refresh-schedule-button").hidden = false;
    document.querySelector("#cancel-schedule-button").hidden = false;

    // Hide the generate schedule button
    document.querySelector("#generate-schedule-button").hidden = true;

    // Hide the loading screen
    loadingScreen.style.display = "none";
}

function showSuggestedActivities() {
    if (suggestedScheduledActivities.length == 0) {
        return;
    }

    // Show the suggested activities
    for (let i = 0; i < suggestedScheduledActivities.length; i++) {
        const suggestedActivity = suggestedScheduledActivities[i];
        addScheduledActivityBlock(suggestedActivity.title, suggestedActivity.category, suggestedActivity.startTime, suggestedActivity.endTime, getCurrentDay(), true);
    }
}

function confirmSchedule() {
    // Hide the confirm/refresh/cancel buttons
    document.querySelector("#confirm-schedule-button").hidden = true;
    document.querySelector("#refresh-schedule-button").hidden = true;
    document.querySelector("#cancel-schedule-button").hidden = true;

    // Show the generate schedule button
    document.querySelector("#generate-schedule-button").hidden = false;

    // Remove all suggested scheduled activity blocks
    removeSuggestedScheduledActivityBlocks();

    // Show the suggested scheduled activities in the calendar
    for (let i = 0; i < suggestedScheduledActivities.length; i++) {
        const suggestedActivity = suggestedScheduledActivities[i];

        // Add the scheduled activity to the scheduled activities array
        saveScheduledActivity(suggestedActivity);

        // Add the block to the calendar
        addScheduledActivityBlock(suggestedActivity.title, suggestedActivity.category, suggestedActivity.startTime, suggestedActivity.endTime, getCurrentDay());

    }

    // Save the newly-scheduled activities to the server
    saveScheduledActivitiesToServer(suggestedScheduledActivities);

    // Clear the suggested scheduled activities array
    suggestedScheduledActivities = [];
}

function refreshSchedule() {
    // Remove all suggested scheduled activity blocks
    removeSuggestedScheduledActivityBlocks();

    // Clear the suggested scheduled activities array
    suggestedScheduledActivities = [];

    // Generate a new schedule
    generateSchedule();
}

function cancelSchedule() {
    // Hide the confirm/refresh/cancel buttons
    document.querySelector("#confirm-schedule-button").hidden = true;
    document.querySelector("#refresh-schedule-button").hidden = true;
    document.querySelector("#cancel-schedule-button").hidden = true;

    // Show the generate schedule button
    document.querySelector("#generate-schedule-button").hidden = false;

    // Remove all suggested scheduled activity blocks
    removeSuggestedScheduledActivityBlocks();

    // Remove all activities from the suggested scheduled activities array
    suggestedScheduledActivities = [];
}

function saveActivity(activity) {
    // Add the activity to the activities array
    activities.push(activity); 

    // Save activities to local storage
    localStorage.setItem("activities", JSON.stringify(activities));
}

function saveScheduledActivity(scheduledActivity) {
    // Add the scheduled activity to the scheduled activities array
    scheduledActivities.push(scheduledActivity);

    // Save scheduled activities to local storage
    localStorage.setItem("scheduled_activities", JSON.stringify(scheduledActivities));
}

function isInWeek(firstDay, date) {
    // Get the first day of the week for the date
    const firstDayOfWeek = new Date(date.setDate(date.getDate() - ((date.getDay() + 6) % 7))); // Set the date to the first day of the week (Monday)

    // Check if the first days of the weeks are equal
    return firstDay.toDateString() === firstDayOfWeek.toDateString();
}

function isInSameWeek(date1, date2) {
    // Get the first day of the week for both dates
    const firstDayOfWeek1 = new Date(date1.setDate(date1.getDate() - ((date1.getDay() + 6) % 7))); // Set the date to the first day of the week (Monday)
    const firstDayOfWeek2 = new Date(date2.setDate(date2.getDate() - ((date2.getDay() + 6) % 7))); // Set the date to the first day of the week (Monday)

    // Check if the first days of the weeks are equal
    return firstDayOfWeek1.toDateString() === firstDayOfWeek2.toDateString(); 
}

function removeActivityBlocks() {
    let activityBlocks = document.querySelectorAll(".block");

    for (let i = 0; i < activityBlocks.length; i++) {
        const block = activityBlocks[i]
        block.remove();
    }
}

function removeScheduledActivityBlocks() {
    let scheduledActivityBlocks = document.querySelectorAll(".scheduled-block");

    for (let i = 0; i < scheduledActivityBlocks.length; i++) {
        const block = scheduledActivityBlocks[i];
        block.remove();
    }
}

function removeSuggestedScheduledActivityBlocks() {
    let suggestedScheduledActivityBlocks = document.querySelectorAll(".suggested-scheduled-block");

    for (let i = 0; i < suggestedScheduledActivityBlocks.length; i++) {
        const block = suggestedScheduledActivityBlocks[i];
        block.remove();
    }
}

function setTimeLinePosition() {
    
    // Get the time line element
    const timeLine = document.querySelector(".time-line");
    /*
    timeLine.remove();

    // Get the calendar grid element
    const calendarGrid = document.querySelector(".calendar-grid");

    // Create a new time line element
    const newTimeLine = document.createElement("div");
    newTimeLine.classList.add("time-line");
    */
    // Total ms in a day
    const totalMsInADay = 24 * 60 * 60 * 1000;

    // Get the current date
    const currentDate = new Date();

    // Get the current time in ms (since midnight)
    const currentTime = (currentDate.getHours() * 60 * 60 * 1000) + (currentDate.getMinutes() * 60 * 1000);

    // Set the position of the time line to the current time (as a percentage of the total ms in a day)
    timeLine.style.top = (currentTime / totalMsInADay) * 100 + "%"; 

    // Add the time line to the calendar grid
    //calendarGrid.appendChild(newTimeLine);
}

function updateCurrentActivity() {
    if (currentActivityIndex != -1) {
        // Get the activity from the activities array - THIS IS A REFERENCE AND NOT A COPY
        const currentActivity = activities[currentActivityIndex];

        // Get the current time in minutes
        const currentDate = new Date();
        const timeInMinutes = (currentDate.getHours() * 60) + currentDate.getMinutes();

        // Set the endTime of the activity to this time
        currentActivity.endTime = timeInMinutes;

        // Update the goal associated with that activity if there is one
        /* SCRAPPED THIS LOL - IDK HOW TO DO THIS SO ILL JUST UPDATE WHEN THE ACTIVITY FINISHES

        if (currentActivity.goalName != "None") {
            const goalsString = localStorage.getItem("goals");


            if (goalsString != null) {
                const goals = JSON.parse(goalsString);

                // Find the goal referred to by the activity
                for (let i = 0; i < goals.length; i++) {
                    if (goals[i].title == currentActivity.goalName && goals[i].date == currentActivity.date) {
                        // Goal has been found

                    }
                }

            }
        }*/

        // Save the activities array to local storage
        localStorage.setItem("activities", JSON.stringify(activities));

        // Save the current activity to local storage
        localStorage.setItem("running_activity", JSON.stringify(currentActivity));

        // Reset all activities onscreen (may change this later if its too chopped)
        //removeActivityBlocks();
        //loadActivities();
        // This was in fact too chopped so update the current activity block instead
        const currentActivityElement = document.querySelector(".flash");

        // Delete the current activity block and add a new one, IF IN THE CURRENT WEEK
        if (isInWeek(firstDayOfWeek, new Date(currentActivity.date))) {
            addBlock(currentActivity.title, currentActivity.category, currentActivity.startTime, currentActivity.endTime, getCurrentDay(), true);
            currentActivityElement.remove();
        }

        console.log("updated");
    }
}

async function updateActivityOnServer(activity) {
    // Check if authenticated
    const authResult = await checkAuth();
    if (authResult == true) {
        // Check if the id has been loaded
        if (editedActivityId == -1) {
            return;
        }
        // Send activity to edit and the activity id to the server
        const editActivityResponse = await fetch("/api/activities/edit", {
            method: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                activity: JSON.stringify(activity),
                id: editedActivityId
            })
        })

        const editActivityData = await editActivityResponse.json();
        if (editActivityResponse.ok && editActivityData.success) {
            // Notify the user that the activity has been edited successfully
            showToastNotification(`Activity '${activity.title}' updated successfully!`);

            // Reset the id
            editedActivityId = -1;
        }
    }
}

async function sendCurrentActivityToServer() {
    // Check if authenticated
    const authResult = await checkAuth();
    if (authResult == true) {
        // User is authenticated, send the current activity to the server
        const currentActivity = activities[currentActivityIndex];
        const response = await fetch("/api/activities/running", { 
            method: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(currentActivity)
        });

        if (response.ok) {
            console.log("Current activity sent to server");
        } else {
            console.error("Error sending current activity to server");
        }
    }
}

function initialiseTopButton() {
    console.log("bar");
    const addButton = document.querySelector("#add-button");
    const stopButton = document.querySelector("#stop-button");

    // Show the delete button if there is an activity running, and set its text
    if (currentActivityIndex != -1) {
        addButton.hidden = true;

        const activityName = activities[currentActivityIndex].title;
        stopButton.textContent = "Stop '" + activityName + "'";
        stopButton.hidden = false;
    }
    else {
        addButton.hidden = false;

        stopButton.hidden = true;
    }

    // If on mobile, delete the generate schedule button
    if (isMobile()) {
        const generateScheduleButton = document.querySelector("#generate-schedule-button");
        generateScheduleButton.remove();
    }
}

function initialiseSavedFlag() {
    if (!localStorage.getItem("saved_to_server")) {
        localStorage.setItem("saved_to_server", false);
    }
}

function updateCalendar() {
    updateCurrentActivity();
    setTimeLinePosition();
}

// Temporary function to delete goalName from activities where the goal no longer exists (for consistency)
function removeDeletedGoalsFromActivities() {
    for (let i = 0; i < activities.length; i++) {
        if (Object.hasOwn(activities[i], "goalName")) {
            let found = false;

            let goals = JSON.parse(localStorage.getItem("goals"));

            for (let j = 0; j < goals.length; j++) {
                if (activities[i].date == goals[j].date && activities[i].goalName == goals[j].title) {
                    console.log("found goal");
                    found = true;
                }
            }

            if (!found) {
                console.log("deleted");
                console.log(activities[i].title)
                console.log(activities[i].goalName);

                // Remove the goalName property
                delete activities[i].goalName;
            }
        }
    }

    localStorage.setItem("activities", JSON.stringify(activities));
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

async function displayBannerIfExpired() {
    /*
    const authResponse = await fetch("/api/auth", {
        method: "GET",
        headers: {
            "X-Requested-With": "XMLHttpRequest", // Indicate that this is an AJAX request
        },
    })

    const authData = await authResponse.json();

    if (authData.authenticated == false /*&& authData.expired == true) {
        // Unhide banner
        //document.querySelector(".banner").hidden = false;

        // Use a toast instead
    }
    */
    // ABOVE CODE IS REDUNDANT BECAUSE AUTH CHECK IS DONE IN INIT()
    showToastNotification("⚠️ You are currently not logged in. Log in to sync your activities. ⚠️");
}

async function clearStorageIfExpired() {
    const authResponse = await fetch("/api/auth", {
        method: "GET",
        headers: {
            "X-Requested-With": "XMLHttpRequest", // Indicate that this is an AJAX request
        },
    })

    const authData = await authResponse.json();

    if (authData.authenticated == false && authData.expired == true) {
        // Clear local storage
        localStorage.removeItem("activities");
        localStorage.removeItem("goals");
        localStorage.removeItem("scheduled_activities");
        localStorage.removeItem("running_activity");

        localStorage.setItem("current_activity", -1);
        currentActivityIndex = -1;
    }
}

async function removeCurrentlyRunningActivityFromServer() {
    // Check if authenticated
    const authResult = await checkAuth();

    if (authResult == true) {
        // Remove the currently running activity from the server
        const runningActivityResponse = await fetch("/api/activities/running/stop", {
            method: "POST",
            body: {},
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
        })

        const runningActivityData = await runningActivityResponse.json();

        if (runningActivityResponse.ok && runningActivityData.success) {
            //alert("Removed running activity");
        }
        else {
            //alert("Failed to remove running activity");
        }
    }
    else {
        //alert("NOT AUTHENTICATED");
    }
}

// Function to sync localStorage with server-side state
async function syncLocalStorageToServer() {
    const authResult = await checkAuth();

    if (authResult == true) {
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
    }
    else {
        //alert("NOT AUTHENTICATED");
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

async function pullScheduledActivitiesFromServer() {
    // For now, if any scheduled activities overlap between local storage and the server, prioritise the server

    // Get scheduled activities from the server
    const scheduledActivitiesResponse = await fetch("/api/scheduled-activities", {
        method: "GET",
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json"
        }
    });

    const scheduledActivitiesData = await scheduledActivitiesResponse.json();

    if (scheduledActivitiesResponse.ok && scheduledActivitiesData) {
        // Overwrite local storage (ok because sync was already performed)
        localStorage.setItem("scheduled_activities", JSON.stringify(scheduledActivitiesData));
    }
}

async function pullCurrentlyRunningActivity() {
    // Get currently running activity from server
    const runningActivityResponse = await fetch("/api/activities/running", {
        method: "GET",
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json"
        }
    })

    const runningActivityData = await runningActivityResponse.json();

    if (runningActivityResponse.ok && !runningActivityData.no_activity) {
        // Store the currently running activity in local storage
        localStorage.setItem("running_activity", JSON.stringify(runningActivityData));
    }
    else {
        // Remove currently running activity from local storage
        localStorage.removeItem("running_activity");
        localStorage.setItem("current_activity", -1); // Reset current activity index
        currentActivityIndex = -1;
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

function toggleScheduled() {
    // Check the value of the checkbox
    if (document.querySelector("#scheduled-checkbox").checked == true) {
        // Show scheduled activities
        loadScheduledActivities();
    }
    else {
        // Hide scheduled activities
        removeScheduledActivityBlocks();
    }
}

async function toggleLogged() {
    // Check the value of the checkbox
    if (document.querySelector("#logged-checkbox").checked == true) {
        // Show logged activities
        await loadActivities();
    }
    else {
        // Hide logged activities
        removeActivityBlocks();
    }
}

function canShowScheduled() {
    return document.querySelector("#scheduled-checkbox").checked;
}

function canShowLogged() {
    return document.querySelector("#logged-checkbox").checked;
}

function removeLoadingScreen() {
    document.querySelector(".loading-screen").remove();
}

function setPageLoadedFlag() {
    initialPageLoad = false;
}

async function init() {
    //await syncLocalStorageToServer();
    if (await checkAuth() == true) {
        await pullCurrentlyRunningActivity();
        await pullActivitiesFromServer()
        await pullScheduledActivitiesFromServer();
        console.log("Fetched from server");
    }
    else {
        await clearStorageIfExpired();
        displayBannerIfExpired();
    }
    populateCalendar();
    setMonthYear(currentDate); 
    setDayHeadings(currentDate);
    onStartNowCheckboxChange(); 
    setTimeLinePosition();
    initialiseEmailAddress();
    await loadActivities();
    await loadScheduledActivities();
    initialiseTopButton();
    setPageLoadedFlag();
    removeLoadingScreen();

    // Reset the time line position every second
    setInterval(updateCalendar, 1000);
}

init();

//initialiseSavedFlag();
//syncLocalStorageToServer();
//pullActivitiesFromServer();
//displayBannerIfExpired();
//populateCalendar();
//setMonthYear(currentDate); 
//setDayHeadings(currentDate);
//onStartNowCheckboxChange(); 
//loadActivitiesFromServer();
//loadActivities();
//initialiseTopButton();
//setTimeLinePosition();

// Reset the time line position every second
//setInterval(setTimeLinePosition, 1000);
//setInterval(updateCalendar, 1000);