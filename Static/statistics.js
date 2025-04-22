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

function loadActivities() {
    let activitiesString = localStorage.getItem("activities");
    if (activitiesString) {
        activities = JSON.parse(activitiesString);
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
            case "Past 7 days":
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
    categoryPieChart.update();


    // Display the total time tracked in the centre of the donut chart
    const categoryTimeTrackedElement = document.getElementById("category-time-tracked");
    categoryTimeTrackedElement.textContent = "Time tracked: " + categoryTimeTracked + " hours";
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
    activityPieChart.update();

    // Display the total time tracked in the centre of the donut chart
    const activityTimeTrackedElement = document.getElementById("activity-time-tracked");
    activityTimeTrackedElement.textContent = "Time tracked: " + activityTimeTracked + " hours";
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
                    position: "top",
                },
                title: {
                    display: true,
                    text: title,
                },
            },
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

loadActivities();
getActivityData();
loadActivityPieChart();

getCategoryData();
loadCategoryPieChart();