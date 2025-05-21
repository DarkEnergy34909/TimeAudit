// A goal has the following properties:
// title: string (e.g. "Get money")
// duration: int (e.g. 60 for 60 minutes, or can be 0 if not a time-limited goal)
// timeDone: int (e.g. 30 for 30 minutes of the goal done)
// completed: boolean

const goals = [];

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
        completed: false
    }

    // Save the goal


    // Create a new UI element for the goal



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
    //const goalDiv = document.createElement("div");

}

// Saves a goal to the goals array and local storage
function saveGoal(goal) {
    goals.push(goal);

    localStorage.setItem("goals", JSON.stringify(goals));
}