// The current date
let currentDate = new Date();

// The first day of the current week
let firstDayOfCurrentWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1)); 

// The first day of the week displayed on-screen (not necessarily the current week)
let firstDayOfWeek = new Date(firstDayOfCurrentWeek);

// A list of all activities 
let activities = [];

// An activity has the following properties
// title: string (e.g. "Gym")
// category: string (e.g. "Exercise")
// startTime: float (e.g. 8.5 for 08:30)
// endTime: float (e.g. 10.0 for 10:00)
// date: string (e.g. "2023-10-01")

function populateCalendar() {
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
        calendarGrid.appendChild(gridDiv);
    }
    //let test = document.getElementById("test");
    //test.innerHTML = hours; 
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

    // Get the start time and end time as floats (e.g. 8.5 for 08:30)
    const startTimeFloat = stringTimeToFloat(startTime);
    const endTimeFloat = stringTimeToFloat(endTime);

    // Get the value of the start now checkbox
    const startNow = document.getElementById("start-now").checked;

    // If the activity name is empty, show an error message and return
    if (activityName.trim() === "") {
        const errorText = document.getElementById("activity-name-error");
        errorText.hidden = false; // Show the error message

        return;
    }

    // Check if the times are valid and return an error message if not
    if (startTime == "" || endTime == "" || startTimeFloat >= endTimeFloat) {
        const errorText = document.getElementById("time-input-error");
        errorText.hidden = false; // Show the error message

        return;
    }

    // Check if the times are already occupied by an activity and return an error message if so

    for (let i = 0; i < activities.length; i++) {
        if (activities[i].date == getIsoString(new Date()) && ((startTimeFloat >= activities[i].startTime && startTimeFloat < activities[i].endTime) || (endTimeFloat > activities[i].startTime && endTimeFloat <= activities[i].endTime))) {
            const errorText = document.getElementById("time-input-error");
            errorText.hidden = false; // Show the error message

            return;
        }
    }

    // If the check now checkbox is checked, return (TODO)
    if (startNow) {
        return; // TODO
    }
    
    
    // Add the block to the calendar
    addBlock(activityName, category, startTimeFloat, endTimeFloat, getCurrentDay()); 

    // Get the current date as an ISO string
    const currentDate = new Date(); 
    const isoString = getIsoString(currentDate);

    // Create a new activity object
    const activity = {
        title: activityName,
        category: category,
        startTime: startTimeFloat,
        endTime: endTimeFloat,
        date: isoString
    };

    console.log(activities);

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
            dayLabels[i].style.color = "red"; // Highlight the current day label in red
        } 
        else {
            dayLabels[i].style.color = "white"; // Reset color for other days
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
    dayLabels[getCurrentDay()].style.color = "white"; 

    // Unhide the next button
    const nextButton = document.getElementById("next-button");
    nextButton.hidden = false; 

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
    }
    else {
        // Unhighlight the current day label
        const dayLabels = document.querySelectorAll(".day");
        dayLabels[getCurrentDay()].style.color = "white"; 
    }

    // Reset displayed activities by removing all blocks and then reloading
    removeActivityBlocks();
    loadActivities();

}
// startTime and endTime are FLOATS (e.g. 8.5 for 08:30)
function addBlock(title, category, startTime, endTime, day) {


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
    block.textContent = title;

    // Calculate width of block - this is the width of a grid column
    const blockWidth = gridColumnWidth;

    // Calculate height of block - this is the height a grid row multiplied by the end time minus the start time (in hours)
    const blockHeight = gridRowHeight * (endTime - startTime);

    // Calculate x position of block - this is the current day of the week (0-6) multiplied by the width of a grid column
    const xPosition = day * gridColumnWidth;

    // Calculate y position of block - this is the start time of the activity (in hours) multiplied by the height of a grid row
    const yPosition = startTime * gridRowHeight;

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
    const addMenu = document.querySelector(".add-menu");
    addMenu.hidden = false; 
}

function closeAddMenu() {
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



function loadActivities() {

    // Load activities from local storage
    const activitiesString = localStorage.getItem("activities");

    // Check if there are any activities saved first
    if (activitiesString) {
        activities = JSON.parse(activitiesString);

        // Iterate through every saved activity
        for (let i = 0; i < activities.length; i++) {
            // If an activity is in the current week, add it to the calendar
            const activity = activities[i];

            // Get the date of the activity
            let activityDate = new Date(activity.date);

            // If the activity is in the current week, add it to the calendar
            if (isInWeek(firstDayOfWeek, activityDate)) {
                console.log("Activity in current week: " + activity.title); 

                // Get the date of the activity again - it's being modified so change this shit later
                activityDate = new Date(activity.date);

                // Get the day from the activity date and adjust to make Monday = 0 and Sunday = 6
                let activityDay = activityDate.getDay(); 
                activityDay = (activityDay + 6) % 7;

                // Add the block to the calendar
                addBlock(activity.title, activity.category, activity.startTime, activity.endTime, activityDay);
            }
        }
    }

    console.log(activitiesString);
    console.log(activities);
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
    const firstDayOfWeek = new Date(date.setDate(date.getDate() - date.getDay() + 1)); // Set the date to the first day of the week (Monday)

    // Check if the first days of the weeks are equal
    return firstDay.toDateString() === firstDayOfWeek.toDateString();
}

function isInSameWeek(date1, date2) {
    // Get the first day of the week for both dates
    const firstDayOfWeek1 = new Date(date1.setDate(date1.getDate() - date1.getDay() + 1)); // Set the date to the first day of the week (Monday)
    const firstDayOfWeek2 = new Date(date2.setDate(date2.getDate() - date2.getDay() + 1)); // Set the date to the first day of the week (Monday)

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

populateCalendar();
setMonthYear(currentDate); 
setDayHeadings(currentDate);
onStartNowCheckboxChange(); 
loadActivities();