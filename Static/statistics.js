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

// A list of activity names
let activityNames = [];

// A list of colours for each activity
let activityColours = [];

// A list of times for each activity
let activityTimes = [];

// The total time tracked, to be displayed in the centre of the donut chart
let activityTimeTracked = 0;

function loadActivities() {
    let activitiesString = localStorage.getItem("activities");
    if (activitiesString) {
        activities = JSON.parse(activitiesString);
    }
}

function getActivityData() {
    // Fill the category times array with 0s
    for (let i = 0; i < categories.length; i++) {
        categoryTimes.push(0);
    }

    // Iterate over all activities
    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const activityName = activity.title;
        const category = activity.category;
        const time = activity.endTime - activity.startTime;
        const activityDate = activity.date;

        // Add the time to the total time tracked
        categoryTimeTracked += time;
        activityTimeTracked += time;

        // Check if the activity date is the current date
        let currentDate = new Date();
        if (activityDate == getIsoString(currentDate)) {
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
                categoryTimes[categoryIndex] += time;

                // Add the corresponding colour to the activity colours array
                activityColours.push(categoryColours[categoryIndex]);
            }
        }
    }
}

function loadCategoryPieChart() {
    // TODO: Sort the categories
    new Chart("category-pie-chart", {
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

    // Display the total time tracked in the centre of the donut chart
    const categoryTimeTrackedElement = document.getElementById("category-time-tracked");
    categoryTimeTrackedElement.textContent = "Time tracked: " + categoryTimeTracked + " hours";
}

function loadActivityPieChart() {
    // TODO: Sort the activities
    new Chart("activity-pie-chart", {
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
    })

    // Display the total time tracked in the centre of the donut chart
    const activityTimeTrackedElement = document.getElementById("activity-time-tracked");
    activityTimeTrackedElement.textContent = "Time tracked: " + activityTimeTracked + " hours";
}

function getIsoString(date) {
    // Get the date in YYYY-MM-DD format
    const isoString = date.toISOString().split('T')[0]; // Get the date part of the ISO string
    return isoString; 
}

loadActivities();
getActivityData();
loadActivityPieChart();
loadCategoryPieChart();