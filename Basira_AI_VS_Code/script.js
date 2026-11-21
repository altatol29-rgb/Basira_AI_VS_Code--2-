// Basira AI - interactive dashboard logic

// Store entered laboratory results while the page is open.
const records = [];

// Get important HTML elements.
const labForm = document.getElementById("labForm");
const resultsBody = document.getElementById("resultsBody");
const summary = document.getElementById("summary");
const chartIndicator = document.getElementById("chartIndicator");
const dateInput = document.getElementById("date");

// Set today's date as the default test date.
dateInput.value = new Date().toISOString().slice(0, 10);

// Listen for the form submission.
labForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // Read the values entered by the user.
    const newRecord = {
        test: document.getElementById("test").value,
        unit: document.getElementById("unit").value,
        value: Number(document.getElementById("value").value),
        date: dateInput.value
    };

    // Add the new result to the records array.
    records.push(newRecord);

    // Refresh the table, summary, and chart.
    renderDashboard();

    // Reset the form for the next result.
    labForm.reset();
    dateInput.value = new Date().toISOString().slice(0, 10);
});

// Clear all results when the Clear History button is clicked.
document.getElementById("clearBtn").addEventListener("click", function () {
    records.length = 0;
    renderDashboard();
});

// Update the chart when the selected indicator changes.
chartIndicator.addEventListener("change", drawChart);

// Display all dashboard information.
function renderDashboard() {
    renderTable();
    renderSummary();
    drawChart();
}

// Show saved results in the history table.
function renderTable() {
    if (records.length === 0) {
        resultsBody.innerHTML =
            '<tr><td colspan="4" class="empty-cell">No results added yet.</td></tr>';
        return;
    }

    const sortedRecords = [...records].sort((a, b) =>
        b.date.localeCompare(a.date)
    );

    resultsBody.innerHTML = sortedRecords.map(record => `
        <tr>
            <td>${escapeHTML(record.test)}</td>
            <td>${record.value}</td>
            <td>${escapeHTML(record.unit)}</td>
            <td>${escapeHTML(record.date)}</td>
        </tr>
    `).join("");
}

// Compare the first and latest readings for the selected indicator.
function renderSummary() {
    const selectedTest = chartIndicator.value;

    const matchingRecords = records
        .filter(record => record.test === selectedTest)
        .sort((a, b) => a.date.localeCompare(b.date));

    if (matchingRecords.length < 2) {
        summary.textContent = matchingRecords.length === 1
            ? "One result recorded. Add another result to compare readings."
            : "Add at least two results for the same indicator to view a trend summary.";
        return;
    }

    const firstValue = matchingRecords[0].value;
    const latestValue = matchingRecords[matchingRecords.length - 1].value;
    const difference = latestValue - firstValue;

    let direction = "No numerical change";
    if (difference > 0) direction = "Upward trend";
    if (difference < 0) direction = "Downward trend";

    summary.innerHTML = `
        <strong>${escapeHTML(selectedTest)}</strong><br>
        First reading: ${firstValue}<br>
        Latest reading: ${latestValue}<br>
        Change: <strong>${difference > 0 ? "+" : ""}${difference}</strong><br>
        <span>${direction}</span>
        <p class="helper-text">
            This is a numerical comparison, not a medical interpretation.
        </p>
    `;
}

// Draw a simple line chart using the HTML Canvas element.
function drawChart() {
    const canvas = document.getElementById("trendChart");
    const context = canvas.getContext("2d");
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    // Match the canvas resolution to the screen.
    canvas.width = bounds.width * pixelRatio;
    canvas.height = bounds.height * pixelRatio;
    context.scale(pixelRatio, pixelRatio);

    const width = bounds.width;
    const height = bounds.height;
    const padding = 35;

    context.clearRect(0, 0, width, height);

    const chartRecords = records
        .filter(record => record.test === chartIndicator.value)
        .sort((a, b) => a.date.localeCompare(b.date));

    // Draw light horizontal guide lines.
    context.strokeStyle = "#e5edef";
    for (let line = 0; line < 4; line++) {
        const y = padding + line * (height - 2 * padding) / 3;
        context.beginPath();
        context.moveTo(padding, y);
        context.lineTo(width - padding, y);
        context.stroke();
    }

    if (chartRecords.length === 0) {
        context.fillStyle = "#71838d";
        context.font = "14px Arial";
        context.textAlign = "center";
        context.fillText("Add results to display the chart", width / 2, height / 2);
        return;
    }

    // Calculate positions for each result.
    const values = chartRecords.map(record => record.value);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const range = maximum - minimum || 1;

    const points = chartRecords.map((record, index) => ({
        x: chartRecords.length === 1
            ? width / 2
            : padding + index * (width - 2 * padding) / (chartRecords.length - 1),
        y: height - padding -
            ((record.value - minimum) / range) * (height - 2 * padding)
    }));

    // Connect the data points with a line.
    context.strokeStyle = "#19a89b";
    context.lineWidth = 3;
    context.beginPath();

    points.forEach((point, index) => {
        if (index === 0) {
            context.moveTo(point.x, point.y);
        } else {
            context.lineTo(point.x, point.y);
        }
    });

    context.stroke();

    // Draw a circle and value label for every result.
    points.forEach((point, index) => {
        context.fillStyle = "#167e8c";
        context.beginPath();
        context.arc(point.x, point.y, 5, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = "#526874";
        context.font = "11px Arial";
        context.textAlign = "center";
        context.fillText(
            String(chartRecords[index].value),
            point.x,
            point.y - 12
        );
    });
}

// Escape special characters before displaying user-entered text in HTML.
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Redraw the chart when the browser window changes size.
window.addEventListener("resize", drawChart);

// Show the empty dashboard when the page first opens.
renderDashboard();
