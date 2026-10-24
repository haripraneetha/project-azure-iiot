# Azure IoT Hub Live Telemetry Web Dashboard (`azure_web`)

A real-time telemetry monitoring dashboard designed to ingest, decode, and display live IoT messages from **Azure IoT Hub** / **Azure Event Hubs** using a **Flask (Python)** backend and a **React (JavaScript)** web interface.

---

## 👤 Student Information

- **Student Name**: HARI PRANEETHA M
- **Roll Number**: 24EIR038
- **Institution**: Kongu Engineering College

---

## 🎯 What We Are Doing

The objective of this project is to build an end-to-end telemetry monitoring pipeline that receives messages sent to Azure IoT Hub from connected devices/sensors and presents them live in a web browser.

### Key Capabilities:
1. **Live Azure IoT Hub Telemetry Ingestion**: Listens directly to Azure Event Hubs-compatible endpoint (`EntityPath: iothub-ehub-bharathiot-56245052-1173f97b8c`).
2. **ASCII Decoding & Conversion**:
   - Ingests raw telemetry and converts received ASCII integer sequences (e.g., `72, 101, 108, 108, 111`) into readable strings (`Hello`).
   - Supports plain text, comma-separated decimals, and JSON arrays of byte codes.
3. **Interactive Conversion Demonstration**:
   - Visual breakdown mapping each byte (`72` $\rightarrow$ `'H'`, `101` $\rightarrow$ `'e'`, etc.).
   - Interactive verification tester for arbitrary ASCII code inputs.
4. **Live Connection State & Metrics**: Shows connection status (`CONNECTED`, `CONNECTING`, `DISCONNECTED`), last event ISO UTC timestamp, and rolling event log.

---

## 🐛 Bugs Identified & Fixed

During the debugging phase, the following bugs were identified and resolved:

1. **Syntax Error & Missing Endpoint in `server.py`**:
   - *Bug*: The connection string had invalid syntax (`"Endpoint=sb:"your endpoint";"`) and unpopulated placeholders.
   - *Fix*: Configured the valid Event Hub connection string with support for `AZURE_CONNECTION_STRING` environment variable.

2. **Backend & Frontend Port Mismatch**:
   - *Bug*: `server.py` was running on port `5000`, while `azure_web.js` was hardcoded to fetch from `http://127.0.0.1:8000/api/latest`.
   - *Fix*: Standardized the API port to `5000` across backend and frontend, and added configurable endpoint support via `REACT_APP_API_URL` and a UI URL switcher.

3. **Restricted CORS Policy**:
   - *Bug*: `server.py` only permitted `http://localhost:3000`, which caused CORS errors when running on `127.0.0.1` or when accessed from deployed platforms like Vercel.
   - *Fix*: Updated CORS configuration to allow all origins (`*`).

4. **Event Hub Connection Fragility**:
   - *Bug*: If the Event Hub receiver encountered a network glitch or timeout, the receiver thread exited permanently without retry.
   - *Fix*: Wrapped consumer initialization in a resilient reconnection loop with exponential backoff.

5. **Missing ASCII Telemetry Breakdown in API**:
   - *Bug*: Backend previously only returned a single decoded string, discarding the raw ASCII code list required for assignment verification.
   - *Fix*: Extended the backend response to include `ascii_values`, `ascii_string`, `raw_message`, and `converted_string`.

6. **Frontend UI Incomplete**:
   - *Bug*: Frontend lacked required student identifiers, ASCII value display, and ASCII-to-string demonstration.
   - *Fix*: Redesigned the React dashboard with student details banner, ASCII code cards, live character mapping chips, and interactive conversion tester.

---

## 🚀 How to Run Locally

### 1. Prerequisites
- **Python**: Version 3.9+ (Python 3.12 recommended)
- **Node.js**: Version 18+ (with `npm`)

### 2. Start the Flask Backend
```bash
cd backend
pip install -r requirements.txt # or: pip install flask flask-cors azure-eventhub
python server.py
```
The backend server runs on `http://127.0.0.1:5000`.

### 3. Start the React Frontend
```bash
npm install
npm start
```
The React dashboard opens automatically at `http://localhost:3000`.

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/latest` | `GET` | Returns student details, connection status, raw message, ASCII values, and converted string |
| `/health` | `GET` | Health check probe |

### Example Response (`/api/latest`):
```json
{
  "student_name": "HARI PRANEETHA M",
  "roll_number": "24EIR038",
  "status": "CONNECTED",
  "raw_message": "72, 101, 108, 108, 111",
  "ascii_values": [72, 101, 108, 108, 111],
  "ascii_string": "72, 101, 108, 108, 111",
  "converted_string": "Hello",
  "message": "Hello",
  "timestamp": "2026-10-24T09:18:29.544000+00:00"
}
```

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository (`azure_web`).
4. Framework preset: **Create React App**.
5. Set Environment Variable (optional if testing with deployed backend):
   - `REACT_APP_API_URL`: URL to your live backend endpoint.
6. Click **Deploy**.
