📍 ZeroCrash - AI Smart Navigation System

ZeroCrash is an AI-powered smart navigation system designed to find the safest route, not just the fastest. It analyzes routes for potential risks, predicts accident-prone zones, and provides drivers with real-time, actionable safety alerts.

This project was built with a React frontend, a Python (Flask) backend, and integrated with the Gemini API for intelligent safety briefings.



🚀 Core Features

Interactive Map: A fully responsive map built with Leaflet.js and OpenStreetMap.

Safe Route Calculation: Finds the optimal route and automatically overlays it with risk data.

Real-time Hazard Simulation: A simulator uses reverse geocoding to provide specific, realistic hazard warnings (e.g., "Blind curve on Sayyaji Rao Rd") for any route.

Crowdsourced Alerts: Users can report real-time hazards like potholes or accidents, which instantly appear on the map for all other users.

AI-Powered Safety Briefing: Uses the Gemini API to analyze a route's hazards and provide a concise, conversational safety summary for the driver.

Live Autocomplete Search: A Google Maps-style autocomplete search bar, powered by the Nominatim geocoding service.

🛠️ Tech Stack

Frontend: React (Vite)

Backend: Python (Flask)

Mapping: Leaflet.js, OpenStreetMap, Leaflet Routing Machine

Geocoding: Nominatim API

AI: Google Gemini API

Styling: Tailwind CSS

🏃‍♂️ How to Run This Project

This is a full-stack application with two parts that must be run separately.

1. Backend Server (Python)

First, get the "brain" of the application running.

# 1. Navigate to the backend folder
cd backend

# 2. Create a Python virtual environment
python3 -m venv venv

# 3. Activate the environment
source venv/bin/activate

# 4. Install required libraries
pip3 install Flask Flask-Cors

# 5. Run the server
python3 risk_model_api.py


The backend server will now be running on http://localhost:5000.

2. Frontend Application (React)

In a new, separate terminal, run the user interface.

# 1. Navigate to the frontend folder
cd frontend

# 2. Install all node packages
npm install

# 3. Run the development server
npm run dev 
# (If this fails, use 'npx vite')


The frontend application will open in your browser, likely at http://localhost:5173.