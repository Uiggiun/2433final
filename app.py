import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from azure.cosmos import CosmosClient, exceptions
import joblib
import numpy as np
from textblob import TextBlob
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Retrieve Cosmos DB configuration from environment variables
COSMOS_ENDPOINT = os.getenv("COSMOS_ENDPOINT")
COSMOS_KEY = os.getenv("COSMOS_KEY")
DATABASE_NAME = os.getenv("DATABASE_NAME")
CONTAINER_NAME = os.getenv("CONTAINER_NAME")

if not all([COSMOS_ENDPOINT, COSMOS_KEY, DATABASE_NAME, CONTAINER_NAME]):
    logging.error("Environment variables for Cosmos DB are not set.")
    raise EnvironmentError("Missing required Cosmos DB environment variables")

# Initialize Cosmos DB client
try:
    client = CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY)
    database = client.get_database_client(DATABASE_NAME)
    container = database.get_container_client(CONTAINER_NAME)
    logging.info("Connected to Cosmos DB successfully.")
except Exception as e:
    logging.error("Error connecting to Cosmos DB: %s", e)
    raise

# Load ML model and scaler
try:
    model = joblib.load("ml_model.pkl")
    scaler = joblib.load("scaler.pkl")
    logging.info("ML Model and Scaler loaded successfully.")
except Exception as e:
    logging.error("Error loading model/scaler: %s", e)

# Routes
@app.route("/")
def home():
    return jsonify({"message": "Backend is working!", "success": True})

@app.route("/test_cosmos", methods=["GET"])
def test_cosmos():
    """Test connection to Cosmos DB"""
    try:
        query = "SELECT * FROM c OFFSET 0 LIMIT 1"
        results = list(container.query_items(query=query, enable_cross_partition_query=True))
        return jsonify({"data": results, "success": True})
    except exceptions.CosmosHttpResponseError as e:
        logging.error("Cosmos DB error: %s", e)
        return jsonify({"error": str(e), "success": False}), 500

@app.route("/get_customer/<customer_id>", methods=["GET"])
def get_customer(customer_id):
    """Retrieve customer data by ID"""
    try:
        query = f"SELECT * FROM c WHERE c.customer_id = {customer_id}"
        items = list(container.query_items(query=query, enable_cross_partition_query=True))

        # Add sentiment polarity to each record
        for item in items:
            if 'text' in item and item['text']:
                item['sentiment_polarity'] = TextBlob(item['text']).sentiment.polarity
            else:
                item['sentiment_polarity'] = None

        return jsonify(items), 200
    except Exception as e:
        logging.error("Error in /get_customer: %s", e)
        return jsonify({"error": str(e), "success": False}), 500

@app.route("/predict_risk", methods=["POST"])
def predict_risk():
    """Predict insurance risk using ML model"""
    try:
        data = request.json.get("features")
        if not isinstance(data, list) or len(data) != 3:
            return jsonify({"error": "Invalid input. Expected an array of 3 features.", "success": False})

        # Sentiment analysis
        sentiment_text = data[2]
        sentiment_score = TextBlob(sentiment_text).sentiment.polarity

        # Prepare input for model
        features = np.array([[data[0], data[1], sentiment_score]])
        scaled_features = scaler.transform(features)
        risk_score = model.predict(scaled_features)[0]
        probability = model.predict_proba(scaled_features).max()

        return jsonify({"risk_score": int(risk_score), "probability": probability, "success": True})
    except Exception as e:
        logging.error("Error in /predict_risk: %s", e)
        return jsonify({"error": str(e), "success": False})

# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
#test 3