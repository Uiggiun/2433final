const backendURL = "2433final-bpdgfvgmamheerh5.eastus2-01.azurewebsites.net";
; // Replace with the Flask backend URL

// Fetch Customer Details
function fetchCustomer() {
    const customerId = document.getElementById("customer-id").value;
    fetch(`${backendURL}/get_customer/${customerId}`)
        .then(response => response.json())
        .then(data => {
            let html = "<h3>Customer Details</h3>";
            if (data.length > 0) {
                data.forEach(item => {
                    html += `
                        <p><b>Customer ID:</b> ${item.customer_id}</p>
                        <p><b>Condition:</b> ${item.condition}</p>
                        <p><b>Sentiment Polarity:</b> ${item.sentiment_polarity}</p>
                    `;
                });
            } else {
                html += `<p>No customer found.</p>`;
            }
            document.getElementById("customer-details").innerHTML = html;
        })
        .catch(err => console.error(err));
}

// Predict Risk
function predictRisk(event) {
    event.preventDefault();
    const age = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const sentiment = document.getElementById("sentiment").value;

    fetch(`${backendURL}/predict_risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: [parseInt(age), parseInt(gender), parseFloat(sentiment)] })
    })
        .then(response => response.json())
        .then(data => {
            const resultHtml = data.success
                ? `<p>Risk Score: ${data.risk_score}</p><p>Probability: ${data.probability}</p>`
                : `<p>Error: ${data.error}</p>`;
            document.getElementById("risk-result").innerHTML = resultHtml;
        })
        .catch(err => console.error(err));
}
