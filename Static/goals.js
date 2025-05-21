// A goal has the following properties:
// title: string (e.g. "Get money")
// duration: int (e.g. 60 for 60 minutes, or can be 0 if not a time-limited goal)
// timeDone: int (e.g. 30 for 30 minutes of the goal done)
// completed: boolean
// date: string (ISO)

let goals = [];

function openAddMenu() {
    const addMenu = document.querySelector(".add-menu");
    addMenu.hidden = false;
}

function closeAddMenu() {
    const addMenu = document.querySelector(".add-menu");
    addMenu.hidden = true;
}

function addGoal() {
    // Get the goal attributes
    const goalName = document.querySelector("#goal-name").value;
    const goalDuration = parseInt(document.querySelector("#goal-duration").value);

    // If the goal name is empty, display an error message
    if (goalName == "") {
        document.querySelector("#goal-name-error").hidden = false;

        return;
    }

    // If the duration is not a number, display an error message
    if (goalDuration == NaN) {
        document.querySelector("#duration-error").hidden = false;
        return;
    }
    // Create a goal object
    const newGoal = {
        title: goalName,
        duration: goalDuration, 
        timeDone: 0,
        completed: false,
        date: getIsoString(new Date())
    }

    // Save the goal
    saveGoal(newGoal);

    // Create a new UI element for the goal
    addGoalCard(newGoal);


    // Clear the form inputs
    document.querySelector("#goal-name").value = "";
    document.querySelector("#goal-duration").value = "";

    // Hide the error messages
    document.querySelector("#goal-name-error").hidden = true;
    document.querySelector("#duration-error").hidden = true;

    // Close the menu
    closeAddMenu();
}

// Creates a UI element for the goal
function addGoalCard(goal) {
    const goalTitle = goal.title;
    const goalDuration = goal.duration;
    const goalTimeDone = goal.timeDone;
    const goalCompleted = goal.completed;
    const goalDate = goal.date;
    
    // Create a div for the goal
    const goalDiv = document.createElement("div");
    goalDiv.classList.add("goal-card");

    // Create a div for the goal text
    const goalText = document.createElement("span");
    goalText.classList.add("goal-text");
    goalText.textContent = goalTitle + " - " + goalDuration + " minutes";
    goalDiv.appendChild(goalText);

    // Create a div for the progress chart
    const goalChart = document.createElement("div");
    goalChart.classList.add("goal-progress-container");
    goalDiv.appendChild(goalChart);

    // TODO: add the progress
    // Get the container for the goal div and add the div
    const goalsList = document.querySelector("#goals-list");
    goalsList.appendChild(goalDiv);

}

// Saves a goal to the goals array and local storage
function saveGoal(goal) {
    goals.push(goal);

    localStorage.setItem("goals", JSON.stringify(goals));
}

function getIsoString(date) {
    // Get the date in YYYY-MM-DD format
    const isoString = date.toISOString().split('T')[0]; // Get the date part of the ISO string
    return isoString; 
}

function loadGoals() {
    const goalsString = localStorage.getItem("goals");

    if (goalsString) {
        goals = JSON.parse(goalsString);

        for (let i = 0; i < goals.length; i++) {
            addGoalCard(goals[i]);
        }
    }
}

loadGoals();