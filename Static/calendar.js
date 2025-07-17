// The current date
let currentDate = new Date();

// The first day of the current week
let firstDayOfCurrentWeek = new Date(currentDate.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7))); 

// The first day of the week displayed on-screen (not necessarily the current week)
let firstDayOfWeek = new Date(firstDayOfCurrentWeek);

// A list of all activities 
let activities = [];

// The index of the current activity in the activities array
let currentActivityIndex = -1;

// An activity has the following properties
// title: string (e.g. "Gym")
// category: string (e.g. "Exercise")
// startTime: int (e.g. 510 for 08:30)
// endTime: int (e.g. 600 for 10:00)
// date: string (e.g. "2023-10-01")
// goalName: string (e.g. "Study Physics")

// Putting this here to remind myself what a stupid ass design decision this was
// startTime: float (e.g. 8.5 for 08:30)
// endTime: float (e.g. 10.0 for 10:00)

function isMobile() {
    return window.matchMedia("(max-width: 700px)").matches;
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

        // Get the index of the new activity and save to local storage
        currentActivityIndex = activities.length;
        localStorage.setItem("current_activity", currentActivityIndex)

        // Save the activity itself to local storage
        localStorage.setItem("running_activity", JSON.stringify(activity));

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

        // Post the activity to the server LATER if it is an ongoing activity

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

function stopActivity() {
    // Hide the stop button
    const stopButton = document.querySelector("#stop-button");
    stopButton.hidden = true;

    // Unhide the add button
    const addButton = document.querySelector("#add-button");
    addButton.hidden = false;

    // Get the current activity and update the goal
    const currentActivity = activities[currentActivityIndex];
    addTimeToGoal(currentActivity);

    // Save the activity to the server 
    saveActivityToServer(currentActivity);
    

    // Set the current activity index to -1 and update local storage
    currentActivityIndex = -1;
    localStorage.setItem("current_activity", currentActivityIndex);
    localStorage.removeItem("running_activity");


    // Reset the activity blocks
    removeActivityBlocks();
    loadActivities();

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
            alert("Failed to post activity to the server. Check your network connection.");
        }
        else {
            alert("Posted activity successfully");
        }
    }
    else if (authStatus == false) {
        alert("NOT AUTHENTICATED");
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
            alert("Failed to delete activity from server. Check your network connection.");
        }
        else {
            alert("Deleted activity successfully");
        }
    }
    else if (authStatus == false) {
        alert("NOT AUTHENTICATED");
    }
}

function addTimeToGoal(activity) {
    // Get the goal associated with the activity
    const goalsString = localStorage.getItem("goals");

    if (activity.goalName != "None" && goalsString != null) {
        const goals = JSON.parse(goalsString);

        for (let i = 0; i < goals.length; i++) {
            if (goals[i].title == activity.goalName && goals[i].date == activity.date) {
                // Goal has been found - update its time
                goals[i].timeDone += (activity.endTime - activity.startTime);

                break;
            }
        }

        // Save the goals list to local storage
        localStorage.setItem("goals", JSON.stringify(goals));
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

    // Unhighlight the current day label
    const dayLabels = document.querySelectorAll(".day");
    dayLabels[getCurrentDay()].style.color = "#1e3a8a";

    // Unhide the next button
    const nextButton = document.getElementById("next-button");
    nextButton.hidden = false; 

    // Uncolour the grid divs with the current day
    const gridDivs = document.querySelectorAll(".grid-item-today");
    if (gridDivs.length != 0) {
        for (let i = 0; i < gridDivs.length; i++) {
            gridDivs[i].classList.remove("grid-item-today");
        }
    }

    // Reset displayed activities by removing all blocks and then reloading
    removeActivityBlocks();
    loadActivities();
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
        const nextButton = document.getElementById("next-button");
        nextButton.hidden = true;

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
    }

    // Reset displayed activities by removing all blocks and then reloading
    removeActivityBlocks();
    loadActivities();

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

    // Create a delete button for the block
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "×";
    deleteButton.onclick = function() {
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

                                // TODO: UPDATE SERVER-SIDE
                            }
                        }
                    }
                }
                // If the activity is currently running, reset the index
                if (i == currentActivityIndex) {
                    currentActivityIndex = -1;
                    localStorage.setItem("current_activity", -1);

                    // Hide the stop button and show the add button (at the top of the page)
                    const addButton = document.querySelector("#add-button");
                    const stopButton = document.querySelector("#stop-button");

                    addButton.hidden = false;
                    stopButton.hidden = true;
                }
                // If not, remove the activity from the server
                else {
                    removeActivityFromServer(activities[i]);
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
        case "Good leisure":
            block.style.backgroundColor = "#22C55E"; // Green
            break;
        case "Bad leisure":
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

function openAddMenu() {
    // Make sure the start time is correct if the checkbox is checked
    onStartNowCheckboxChange();

    // Unhide the menu
    const addMenu = document.querySelector(".add-menu");
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
            // If the goal is on the current day add its name as an option
            if (goals[i].date == getIsoString(new Date())) {
                const goalOption = document.createElement("option");
                goalOption.value = goals[i].title;
                goalOption.textContent = goals[i].title;
                
                selectMenu.appendChild(goalOption);
            }
        }
    }
}

function closeAddMenu() {
    // Hide the menu
    const addMenu = document.querySelector(".add-menu");
    addMenu.hidden = true; 
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



function loadActivities() {

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

        if (runningActivityString) {
            // If there is a running activity, add it to the activities array
            // This is because running activities are not saved to the server until they are stopped
            // and are only saved to local storage
            console.log("FAT BASTARD");
            activities.push(JSON.parse(runningActivityString));

            // Save to local storage again
            localStorage.setItem("activities", JSON.stringify(activities));
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

function saveActivity(activity) {
    // Add the activity to the activities array
    activities.push(activity); 

    /*
    // Gets all activities from local storage
    let allActivities = JSON.parse(localStorage.getItem("activities"))

    if (allActivities == null) {
        allActivities = [];
    }
    // Add the new activity to the array of all activities
    allActivities.push(activity);

    // Save all activities to local storage
    localStorage.setItem("activities", JSON.stringify(allActivities)); 
    */
    // Save activities to local storage
    localStorage.setItem("activities", JSON.stringify(activities));
    

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

        // Delete the current activity block and add a new one
        addBlock(currentActivity.title, currentActivity.category, currentActivity.startTime, currentActivity.endTime, getCurrentDay(), true);
        currentActivityElement.remove();

        console.log("updated");
    }
}

function initialiseTopButton() {
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
    const authResponse = await fetch("/api/auth", {
        method: "GET",
        headers: {
            "X-Requested-With": "XMLHttpRequest", // Indicate that this is an AJAX request
        },
    })

    const authData = await authResponse.json();

    if (authData.authenticated == false /*&& authData.expired == true*/) {
        // Unhide banner
        document.querySelector(".banner").hidden = false;

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

    const authResult = await checkAuth();
    if (authResult == true) {

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
}

// Logout function
async function logout() {
    const authResult = await checkAuth();
    if (authResult) {
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
            // Redirect to landing page
            window.location.href = "/";
        }
    }
}

async function init() {
    //await syncLocalStorageToServer();
    await pullActivitiesFromServer();
    displayBannerIfExpired();
    populateCalendar();
    setMonthYear(currentDate); 
    setDayHeadings(currentDate);
    onStartNowCheckboxChange(); 
    loadActivities();
    initialiseTopButton();
    setTimeLinePosition();

    // Reset the time line position every second
    //setInterval(setTimeLinePosition, 1000);
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