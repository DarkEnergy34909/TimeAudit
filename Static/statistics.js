// Disable the default legend for the chart
//Chart.defaults.global.legend.display = false;

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

// A list of all activities
let activities = [];

// A list of all categories for the donut chart
let categories = ["Work/Study", "Exercise", "Social", "Chores/Errands", "Eat/Drink", "Good leisure", "Bad leisure", "Personal care", "Sleep/Napping", "Travel", "Planning/Reflection", "Other"];

// A list of corresponding colours for each category
let categoryColours = ["#3B82F6", "#FF6B35", "#8B5CF6", "#D6A85D", "#F97316", "#22C55E", "#991B1B", "#A7F3D0", "#1E3A8A", "#60A5FA", "#14B8A6", "#9CA3AF"];

// A list of category times for the donut chart
let categoryTimes = [];

// The total time tracked, to be displayed in the centre of the donut chart
let categoryTimeTracked = 0;

// The categories pie chart
let categoryPieChart = createEmptyDonutChart("category-pie-chart", "Activities");

// A list of activity names
let activityNames = [];

// A list of colours for each activity
let activityColours = [];

// A list of times for each activity
let activityTimes = [];

// The total time tracked, to be displayed in the centre of the donut chart
let activityTimeTracked = 0;

// The activity pie chart
let activityPieChart = createEmptyDonutChart("activity-pie-chart", "Activities");

// A list of all days in the week
//let daysInWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
let daysInWeek = [];

// A list of the times of a category for each day of the week
//let categoryTimesByDay = [];

// The category bar chart
let categoryBarChart = createEmptyBarChart("category-bar-chart", "Activities")

// The goals completed by the user
let goals = [];

// The goals bar chart
let goalsBarChart = createEmptyBarChart("goals-bar-chart", "Goals");

function loadActivities() {
    const activitiesString = localStorage.getItem("activities");
    if (activitiesString) {
        activities = JSON.parse(activitiesString);
    }
}

function loadGoals() {
    const goalsString = localStorage.getItem("goals");
    if (goalsString != null) {
        goals = JSON.parse(goalsString);
    }
}

function getActivityData() {

    // Iterate over all activities
    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const activityName = activity.title;
        const category = activity.category;
        const time = activity.endTime - activity.startTime;
        const activityDate = activity.date;

        // Add the time to the total time tracked
        //categoryTimeTracked += time;

        // Check if the activity date is the current date
        let currentDate = new Date();
        if (activityDate == getIsoString(currentDate)) {
            // Add the time to the activity time tracked
            activityTimeTracked += time;

            // Push each activity name to the activity names array
            activityNames.push(activityName);

            // Push the time of the activity to the activity times array
            activityTimes.push(time);

            // Add the time of the activity to the corresponding position in the category times array
            const categoryIndex = categories.indexOf(category);
            if (categoryIndex == -1) {
                console.log("wtf" + category);
            }
            else {
                //categoryTimes[categoryIndex] += time;
                // Add the corresponding colour to the activity colours array
                activityColours.push(categoryColours[categoryIndex]);
            }
        }

        /*// Add the time of the activity to the corresponding position in the category times array
        const categoryIndex = categories.indexOf(category);
        if (categoryIndex == -1) {
            console.log("wtf" + category);
        }
        else {
            categoryTimes[categoryIndex] += time;
        }*/
    }
}

function getCategoryData() {
    // Reset time tracked to 0
    categoryTimeTracked = 0;

    // Get the currently selected option from the drop-down menu
    const dropDown = document.querySelector(".by-time");
    const option = dropDown.value;

    // Fill the category times array with 0s if it is empty, if not then overwrite the existing array with 0s
    if (categoryTimes.length == 0) {
        for (let i = 0; i < categories.length; i++) {
            categoryTimes.push(0);
        }
    }
    else {
        for (let i = 0; i < categories.length; i++) {
            categoryTimes[i] = 0;
        }
    }

    // Iterate over all activities
    for (let i = 0; i < activities.length; i++) {
        // Get activity info
        const activity = activities[i];
        const category = activity.category;
        const time = activity.endTime - activity.startTime;
        const activityDate = activity.date;

        // Get the current date
        const currentDate = new Date();

        // Get the date of the activity as a Date object
        const activityDateObj = new Date(activityDate);

        switch (option) {
            case "Today":
                // Check if the activity date is the current date
                if (activityDate == getIsoString(currentDate)) {
                    // Add the activity time to the time tracked
                    categoryTimeTracked += time;

                    // Add the time of the activity to the corresponding position in the category times array
                    const categoryIndex = categories.indexOf(category);
                    if (categoryIndex == -1) {
                        console.log("wtf" + category);
                    }
                    else {
                        categoryTimes[categoryIndex] += time;
                    }
                }

                break;
            case "Past week":
                // Check if the activity date is in the past 7 days
                const date7DaysAgo = (new Date()).getTime() - (7 * 24 * 60 * 60 * 1000);

                if (activityDateObj.getTime() >= date7DaysAgo) {
                    // Add the activity time to the time tracked
                    categoryTimeTracked += time;

                    // Add the time of the activity to the corresponding position in the category times array
                    const categoryIndex = categories.indexOf(category);
                    if (categoryIndex == -1) {
                        console.log("wtf" + category);
                    }
                    else {
                        categoryTimes[categoryIndex] += time;
                    }
                }
                break;
            case "Past month":
                // Check if the activity date is in the past month
                const date1MonthAgo = (new Date()).getTime() - (30 * 24 * 60 * 60 * 1000);

                if (activityDateObj.getTime() >= date1MonthAgo) {
                    // Add the activity time to the time tracked
                    categoryTimeTracked += time;

                    // Add the time of the activity to the corresponding position in the category times array
                    const categoryIndex = categories.indexOf(category);
                    if (categoryIndex == -1) {
                        console.log("wtf" + category);
                    }
                    else {
                        categoryTimes[categoryIndex] += time;
                    }
                }

                break;
            case "Past year":
                // Check if the activity date is in the past year
                const date1YearAgo = (new Date()).getTime() - (365 * 24 * 60 * 60 * 1000);

                if (activityDateObj.getTime() >= date1YearAgo) {
                    // Add the activity time to the time tracked
                    categoryTimeTracked += time;

                    // Add the time of the activity to the corresponding position in the category times array
                    const categoryIndex = categories.indexOf(category);
                    if (categoryIndex == -1) {
                        console.log("wtf" + category);
                    }
                    else {
                        categoryTimes[categoryIndex] += time;
                    }
                }

                break;
            case "All time":
                // Add the activity time to the time tracked
                categoryTimeTracked += time;

                // Add the time of the activity to the corresponding position in the category times array
                const categoryIndex = categories.indexOf(category);
                if (categoryIndex == -1) {
                    console.log("wtf" + category);
                }
                else {
                    categoryTimes[categoryIndex] += time;
                }
    
    
                break;
            default:
                console.log("Invalid option selected: " + option);
                break;
        }
    }
}

function getSingleCategoryData(category) {
    // Reset arrays
    daysInWeek = [];
    const categoryTimesByDay = [];

    // Get the date 7 days ago
    const date7DaysAgo = (new Date()).getTime() - (7 * 24 * 60 * 60 * 1000);

    // Populate daysInWeek with the days of the week
    for (let j = 0; j < 7; j++) {
        daysInWeek.push(new Date(date7DaysAgo + ((j + 1) * 24 * 60 * 60 * 1000)).toLocaleString('en-US', { weekday: 'long' }));
    }

    // Iterate over all activities
    for (let i = 0; i < activities.length; i++) {

        // Get activity info
        const activity = activities[i];
        const activityCategory = activity.category;
        const time = activity.endTime - activity.startTime;
        const activityDate = activity.date;

        // Get the date of the activity as a Date object
        const activityDateObj = new Date(activityDate);


        // Get the day of the week 7 days ago in English
        //const dayOfWeek7DaysAgo = new Date(date7DaysAgo).toLocaleString('en-US', { weekday: 'long' });

        // Check if the activity date is in the past 7 days
        if (activityDateObj.getTime() >= date7DaysAgo) {
            // Get the index number
            const index = Math.floor((activityDateObj.getTime() - date7DaysAgo) / (24 * 60 * 60 * 1000));

            // If the category is the same as the one selected, add the time to the array
            if (activityCategory == category) {
                // Add the time of the activity to the corresponding position in the category times array
                if (categoryTimesByDay[index] == undefined) {
                    categoryTimesByDay[index] = time;
                }
                else {
                    categoryTimesByDay[index] += time;
                }
            }
        }
    }
    return categoryTimesByDay
}

// Returns an array with finished and unfinished goals for a week
function getGoalData() {
    const finishedGoals = [];
    const unfinishedGoals = [];
    const goalsInProgress = [];

    // Days in week already done in getSingleCategoryData so no need to do again

    // Get the date 7 days ago
    const date7DaysAgo = (new Date()).getTime() - (7 * 24 * 60 * 60 * 1000);
    
    // Iterate over all goals
    for (let i = 0; i < goals.length; i++ ) {
        // Get the goal info
        const goalTimeDone = goals[i].timeDone;
        const goalDuration = goals[i].duration;
        const goalDate = goals[i].date;

        // Get the date of the goal as a date object
        const goalDateObj = new Date(goalDate);

        if (goalDateObj.getTime() >= date7DaysAgo) {
            // Get the index number
            const index = Math.floor((goalDateObj.getTime() - date7DaysAgo) / (24 * 60 * 60 * 1000));

            // Check whether the goal has been completed and add the appropriate array
            if (goalTimeDone >= goalDuration) {
                // Add to finished array
                if (finishedGoals[index] == undefined) {
                    finishedGoals[index] = 1;
                }
                else {
                    finishedGoals[index] += 1;
                }
            }
            // If the goal is today (and unfinished), mark as in progress
            else if (index == 6) {
                if (goalsInProgress[index] == undefined) {
                    goalsInProgress[index] = 1;
                }
                else {
                    goalsInProgress[index] += 1;
                }
            }

            else {
                if (unfinishedGoals[index] == undefined) {
                    unfinishedGoals[index] = 1;
                }
                else {
                    unfinishedGoals[index] += 1;
                }
            }
        }
    }
    return [finishedGoals, unfinishedGoals, goalsInProgress];

}

function loadCategoryPieChart() {
    // TODO: Sort the categories
    /*
    categoryPieChart = new Chart("category-pie-chart", {
        type: "doughnut",
        data: {
            //labels: activities.map(activity => activity.name),
            //labels: ["Running", "Cycling", "Swimming"],
            labels: categories,
            datasets: [{
                backgroundColor: categoryColours,
                data: categoryTimes,
                //data: activities.map(activity => activity.time),
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top",
                },
                title: {
                    display: true,
                    text: "Activities",
                },
            },
            
        }
    })
    */
    // Sort the category data before adding it to the pie chart
    sortPieChartData(categories, categoryColours, categoryTimes);

    // Update pie chart data
    categoryPieChart.data.labels = categories;
    categoryPieChart.data.datasets[0].backgroundColor = categoryColours;
    categoryPieChart.data.datasets[0].data = categoryTimes;

    // Get the total time tracked and update the pie chart
    const timeTrackedHoursAndMinutes = minutesToHoursAndMinutes(categoryTimeTracked);
    categoryPieChart.options.elements.center.text = timeTrackedHoursAndMinutes[0] + " hours " + timeTrackedHoursAndMinutes[1] + " minutes";

    // Update the donut chart
    categoryPieChart.update();

    /*
    // Display the total time tracked in the centre of the donut chart
    const timeTrackedHoursAndMinutes = minutesToHoursAndMinutes(categoryTimeTracked);

    const categoryTimeTrackedElement = document.getElementById("category-time-tracked");
    categoryTimeTrackedElement.textContent = timeTrackedHoursAndMinutes[0] + " hours " + timeTrackedHoursAndMinutes[1] + " minutes";*/
}

function loadActivityPieChart() {
    // TODO: Sort the activities
    /*
    activityPieChart = new Chart("activity-pie-chart", {
        type: "doughnut",
        data: {
            labels: activityNames,
            datasets: [{
                backgroundColor: activityColours,
                data: activityTimes
            }]
        }, 
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top",
                },
                title: {
                    display: true,
                    text: "Activities",
                },
            },
        }
    })*/

    // Sort the activity data before adding it to the pie chart
    sortPieChartData(activityNames, activityColours, activityTimes);

    // Update pie chart data
    activityPieChart.data.labels = activityNames;
    activityPieChart.data.datasets[0].backgroundColor = activityColours;
    activityPieChart.data.datasets[0].data = activityTimes;

    // Get the total time tracked and update the pie chart
    const timeTrackedHoursAndMinutes = minutesToHoursAndMinutes(activityTimeTracked);
    activityPieChart.options.elements.center.text = timeTrackedHoursAndMinutes[0] + " hours " + timeTrackedHoursAndMinutes[1] + " minutes";

    // Update the donut chart
    activityPieChart.update();

    /*
    // Display the total time tracked in the centre of the donut chart
    const timeTrackedHoursAndMinutes = minutesToHoursAndMinutes(activityTimeTracked);

    const activityTimeTrackedElement = document.getElementById("activity-time-tracked");
    activityTimeTrackedElement.textContent = timeTrackedHoursAndMinutes[0] + " hours " + timeTrackedHoursAndMinutes[1] + " minutes";*/
}

function loadCategoryBarChart() {
    // Get the currently selected option from the drop-down menu
    const dropDown = document.querySelector("#single-category-select");
    const option = dropDown.value;

    // Reset the bar chart
    categoryBarChart.data.labels = [];
    categoryBarChart.data.datasets = [{}];

    // Get the category data for the selected option
    if (option != "All") {
        const categoryTimesByDay = getSingleCategoryData(option);

        // Update the bar chart
        categoryBarChart.data.labels = daysInWeek;
        categoryBarChart.data.datasets[0].backgroundColor = categoryColours[categories.indexOf(option)];
        categoryBarChart.data.datasets[0].data = categoryTimesByDay;
        //categoryBarChart.options.scales.y.title.text = option + " time tracked (minutes)";
        //categoryBarChart.options.scales.y.title.display = true;
        //categoryBarChart.options.scales.y.title.font.size = 16;
        //categoryBarChart.options.scales.y.beginAtZero = true;
    }
    else {
        // The list of datasets to be used for the stacked bar chart
        //const datasets = [];

        // Add data for each category to the array
        for (let i = 0; i < categories.length; i++) {
            categoryBarChart.data.datasets.push({
                backgroundColor: categoryColours[i],
                data: getSingleCategoryData(categories[i])
            })
        }

        // Set the labels for the bar chart
        categoryBarChart.data.labels = daysInWeek;


    }
    categoryBarChart.options.tooltips.callbacks = {
        label: (tooltipItems, data) => {
            const label = data.labels[tooltipItems.index] || '';
            const value = data.datasets[tooltipItems.datasetIndex].data[tooltipItems.index] || 0;
            const hoursAndMinutes = minutesToHoursAndMinutes(value);

            // Check if hours are 0 and display only minutes if so
            if (hoursAndMinutes[0] == 0) {
                return `${hoursAndMinutes[1]} minutes`;
            } else {
                // Display hours and minutes
                return `${hoursAndMinutes[0]} hours ${hoursAndMinutes[1]} minutes`;
            }
        }
    };

    // Update the bar chart
    categoryBarChart.update();
}

function loadGoalsBarChart() {
    // Reset the bar chart
    goalsBarChart.data.labels = [];
    goalsBarChart.data.datasets = [{}];

    let finishedGoals, unfinishedGoals, goalsInProgress;
    [finishedGoals, unfinishedGoals, goalsInProgress] = getGoalData();

    goalsBarChart.data.labels = daysInWeek;
    goalsBarChart.data.datasets.push({
        // Green for finished goals
        backgroundColor: "#22C55E",
        data: finishedGoals
    })
    goalsBarChart.data.datasets.push({
        // Red for unfinished goals
        backgroundColor: "#e30202",
        data: unfinishedGoals
    })
    goalsBarChart.data.datasets.push({
        // Grey for in-progress goals
        backgroundColor: "#d4d4d4",
        data: goalsInProgress
    })

    // Update the chart
    goalsBarChart.update();
}

function getIsoString(date) {
    // Get the date in YYYY-MM-DD format
    const isoString = date.toISOString().split('T')[0]; // Get the date part of the ISO string
    return isoString; 
}

function daysBetween(isoDate1, isoDate2) {
    const year1 = isoDate1.split("-")[0];
    const month1 = isoDate1.split("-")[1];
    const day1 = isoDate1.split("-")[2];

    const year2 = isoDate1.split("-")[0];
    const month2 = isoDate1.split("-")[1];
    const day2 = isoDate1.split("-")[2];
}

function createEmptyDonutChart(id, title) {
    return new Chart(id, {
        type: "doughnut",
        data: {
            labels: [],
            datasets: [{
                backgroundColor: [],
                data: []
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                    
                    display: false,
                },
                title: {
                    display: true,
                    text: title,
                },
            },
            tooltips: {
                callbacks: {
                    label: (tooltipItems, data) => {
                        const label = data.labels[tooltipItems.index] || '';
                        const value = data.datasets[tooltipItems.datasetIndex].data[tooltipItems.index] || 0;
                        const hoursAndMinutes = minutesToHoursAndMinutes(value);
                        // Check if hours are 0 and display only minutes if so
                        if (hoursAndMinutes[0] == 0) {
                            return `${label}: ${hoursAndMinutes[1]} minutes`;
                        } else {
                            // Display hours and minutes
                            return `${label}: ${hoursAndMinutes[0]} hours ${hoursAndMinutes[1]} minutes`;
                        }
                    }
                },
            },
            elements: {
                center: {
                    text: "",
                    fontStyle: "Poppins",
                    // color:
                    // fontStyle
                    sidePadding: "30"
                    // minFontSize
                    // lineHeight
                }
            }
        }
    })
}

function createEmptyBarChart(id, title) {
    return new Chart(id, {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                backgroundColor: [],
                data: []
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                    },
                    stacked: true
                }],
                xAxes: [{
                    stacked: true
                }],
            },
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                },
            },
            legend: {
                display: false,
            }
        }
    })
}

// Arrays are pass-by-reference in JS
function sortPieChartData(labels, colours, data) {
    // Create an array of objects from the data
    const dataObjects = [];

    for (let i = 0; i < labels.length; i++) {
        // Create a new object 
        const dataObject = {
            label: labels[i],
            colour: colours[i],
            dataPoint: data[i]
        }

        // Append the object to the array
        dataObjects.push(dataObject);
    }

    // Sort the dataObjects array by the data point (descending order)
    dataObjects.sort(function(a,b){return b.dataPoint - a.dataPoint})

    // Iterate through the sorted dataObjects array and replace the items in the original arrays
    for (let i = 0; i < labels.length; i++) {
        labels[i] = dataObjects[i].label;
        colours[i] = dataObjects[i].colour;
        data[i] = dataObjects[i].dataPoint;
    }

    // No need to return anything as arrays are pass-by-reference
}

function minutesToHoursAndMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return [hours, remainingMinutes];
}

function populateBarChartSelectMenu() {
    const selectMenu = document.querySelector("#single-category-select");

    // Add "All" as an option
    const newOption = document.createElement("option");
    newOption.value = "All";
    newOption.textContent = "All";
    selectMenu.appendChild(newOption);

    for (let i = 0; i < categories.length; i++) {

        // Create a new option
        const newOption = document.createElement("option");
        newOption.value = categories[i];
        newOption.textContent = categories[i];

        // Append the option to the select menu
        selectMenu.appendChild(newOption);
    }
}

function getIsoString(date) {
    // Get the date in YYYY-MM-DD format
    const isoString = date.toISOString().split('T')[0]; // Get the date part of the ISO string
    return isoString; 
}

loadActivities();
getActivityData();
loadActivityPieChart();

getCategoryData();
loadCategoryPieChart();

populateBarChartSelectMenu();
loadCategoryBarChart();

loadGoals();
loadGoalsBarChart();
