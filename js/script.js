const backendURL = "https://2433dbfinal-insurance-eegca7hagwgrbsdg.eastus2-01.azurewebsites.net/";

// Helper function to update DOM elements
function updateElementContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    }
}

async function fetchCustomer() {
    const customerId = document.getElementById("customer-id").value;
    if (!customerId) {
        updateElementContent("customer-details", "<p>Please enter a valid Customer ID.</p>");
        return;
    }

    try {
        const response = await fetch(`${backendURL}/get_customer/${customerId}`);
        const data = await response.json();

        let html = "<h3>Customer Details</h3>";
        if (data.length > 0) {
            const keysToRemove = ["_attachments", "_etag", "_rid", "_self", "_ts"];
            data.forEach(item => {
                html += "<div class='customer-details'>";
                for (const [key, value] of Object.entries(item)) {
                    if (!keysToRemove.includes(key)) {
                        html += `<p><b>${key}:</b> ${value}</p>`;
                    }
                }
                html += "</div><hr>";
            });
        } else {
            html += "<p>No customer found.</p>";
        }
        updateElementContent("customer-details", html);
    } catch (err) {
        console.error(err);
        updateElementContent("customer-details", "<p>An error occurred while fetching customer details.</p>");
    }
}



// Predict Risk
async function predictRisk(event) {
    event.preventDefault();

    const age = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const sentiment = document.getElementById("sentiment").value;

    if (!age || !gender || !sentiment) {
        updateElementContent("risk-result", "<p>Please enter all fields.</p>");
        return;
    }

    try {
        const response = await fetch(`${backendURL}/predict_risk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                features: [parseFloat(age), parseFloat(gender), parseFloat(sentiment)]
            })
        });

        const data = await response.json();
        if (data.success) {
            updateElementContent("risk-result", `
                <p><b>Risk Score:</b> ${data.risk_score}</p>
                <p><b>Probability:</b> ${data.probability.toFixed(2)}</p>
            `);
        } else {
            updateElementContent("risk-result", `<p>Error: ${data.error}</p>`);
        }
    } catch (err) {
        console.error(err);
        updateElementContent("risk-result", "<p>An error occurred while predicting risk.</p>");
    }
}

