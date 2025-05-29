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


// A goal has the following properties:
// title: string (e.g. "Get money")
// duration: int (e.g. 60 for 60 minutes, or can be 0 if not a time-limited goal)
// timeDone: int (e.g. 30 for 30 minutes of the goal done)
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
    const goalDuration = (parseInt(document.querySelector("#goal-duration-minutes").value)) + (60 * parseInt(document.querySelector("#goal-duration-hours").value));

    // If the goal name is empty, display an error message
    if (goalName == "") {
        document.querySelector("#goal-name-error").hidden = false;

        return;
    }

    // If the duration is not a number, display an error message
    if (goalDuration == NaN || goalDuration == 0) {
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
    document.querySelector("#goal-duration-hours").value = "0";
    document.querySelector("#goal-duration-minutes").value = "1";

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
    const goalDate = goal.date;
    
    // Create a div for the goal
    const goalDiv = document.createElement("div");
    goalDiv.classList.add("goal-card");

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
    const goalChartId = goalTitle + "-chart";
    goalChart.id = goalChartId;
    goalChart.width = "100";
    goalChart.height = "100";

    goalChartContainer.appendChild(goalChart);
    goalDiv.appendChild(goalChartContainer);

    // Create a delete (X) button for the goal
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "×";
    deleteButton.hidden = true;

    deleteButton.onclick = function() {
        // Remove the goal element
        goalDiv.remove();

        // Remove the goal from the goals array
        for (let i = 0; i < goals.length; i++) {
            if (goals[i].title == goalTitle && goals[i].duration == goalDuration && goals[i].timeDone == goalTimeDone && goals[i].date == goalDate) {
                // Remove the goal at index i
                goals.splice(i, 1);

                // Update local storage
                updateGoalsStorage();

                break;
            }
        }
    }
    goalDiv.appendChild(deleteButton);

    // Hide/unhide the delete button when hovering
    goalDiv.onmouseover = function() {
        // Get the delete button and hide it
        const button = goalDiv.querySelector("button");
        button.hidden = false;
    }

    goalDiv.onmouseout = function() {
        // Get the delete button and show it
        const button = goalDiv.querySelector("button");
        button.hidden = true;
    }

    // Get the container for the goal div and add the div
    const goalsList = document.querySelector("#goals-list");
    goalsList.appendChild(goalDiv);

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

function loadGoals() {
    const goalsString = localStorage.getItem("goals");

    if (goalsString) {
        goals = JSON.parse(goalsString);

        for (let i = 0; i < goals.length; i++) {
            addGoalCard(goals[i]);
        }
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

loadGoals();