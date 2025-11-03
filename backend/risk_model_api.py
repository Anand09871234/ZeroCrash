from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json

# Initialize the Flask application
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS) to allow our frontend to communicate with this backend
CORS(app)

# --- In-Memory Database ---
# For this prototype, we'll store the reported hazards in a simple list in memory.
# In a real-world application, this would be a proper database like PostgreSQL or MongoDB.
reported_hazards = [
    # Some initial sample data to show on the map when it first loads
    {
        "hazardType": "Pothole",
        "description": "Deep pothole in the middle of the road near Lalitha Mahal.",
        "latitude": 12.3027,
        "longitude": 76.6796,
        "timestamp": "2025-09-18T22:15:00Z"
    },
    {
        "hazardType": "Traffic Jam",
        "description": "Heavy congestion reported on Irwin Road.",
        "latitude": 12.3116,
        "longitude": 76.6455,
        "timestamp": "2025-09-19T00:10:00Z"
    }
]

# --- API Endpoint to Get All Reported Hazards ---
@app.route('/get-hazards', methods=['GET'])
def get_hazards():
    """
    This endpoint returns the list of all user-reported hazards.
    The frontend calls this when the map loads to display existing reports.
    """
    print(f"GET /get-hazards - Returning {len(reported_hazards)} hazards.")
    return jsonify(reported_hazards)

# --- API Endpoint to Report a New Hazard ---
@app.route('/report-hazard', methods=['POST'])
def report_hazard():
    """
    This endpoint receives a new hazard report from a user.
    It adds a timestamp and saves it to our in-memory list.
    """
    # Get the JSON data sent from the frontend
    report_data = request.get_json()

    if not report_data:
        return jsonify({"status": "error", "message": "No data provided"}), 400

    # Create a new hazard record, adding a server-side timestamp
    new_hazard = {
        "hazardType": report_data.get("hazardType", "Unknown"),
        "description": report_data.get("description", ""),
        "latitude": report_data.get("latitude"),
        "longitude": report_data.get("longitude"),
        "timestamp": datetime.utcnow().isoformat() + "Z" # ISO 8601 format
    }
    
    # Check for mandatory fields
    if not new_hazard["latitude"] or not new_hazard["longitude"]:
        return jsonify({"status": "error", "message": "Missing location data"}), 400

    # Add the new report to our list
    reported_hazards.append(new_hazard)
    
    # Print to the console for debugging
    print("-" * 20)
    print("New Hazard Reported:")
    print(json.dumps(new_hazard, indent=2))
    print("-" * 20)

    # Send a success response back to the frontend
    return jsonify({"status": "success", "message": "Hazard reported successfully!"}), 201

# --- Original AI Risk Analysis Endpoint (Placeholder) ---
@app.route('/risk-analysis', methods=['POST'])
def get_risk_analysis():
    """
    This is a placeholder for the future AI model. It simulates taking
    route data and returning a risk score.
    """
    route_data = request.get_json()
    print("Received route data for analysis:", route_data)
    
    # In the future, this is where the AI/ML model would process the route
    # and return a detailed risk analysis.
    
    # For now, return a mock response
    mock_response = {
        "riskScore": 78,
        "riskLevel": "Medium",
        "highRiskZones": [
          {"lat": 12.3051, "lng": 76.6552, "description": "High pedestrian traffic near Mysore Palace"},
          {"lat": 12.2850, "lng": 76.6650, "description": "Blind curve with poor visibility on approach road"},
        ]
    }
    return jsonify(mock_response)


# --- Main execution block ---
if __name__ == '__main__':
    # Runs the Flask server on localhost, port 5000.
    # The debug=True flag allows the server to auto-reload when you save changes.
    app.run(host='0.0.0.0', port=5000, debug=True)
