# System Monitor

A real-time system monitoring app with a Python (Flask) backend and React frontend. Tracks CPU, memory, and disk usage with auto-refreshing gauges.

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm

## Running the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

The API server starts at `http://localhost:5000`.

### API Endpoint

- `GET /api/stats` — Returns JSON with CPU, memory, and disk metrics.

## Running the Frontend

```bash
cd frontend
npm install
npm start
```

The React app starts at `http://localhost:3000` and polls the backend every 2 seconds.

## Build for Production (Frontend)

```bash
cd frontend
npm run build
```

The optimized build output will be in `frontend/build/`.
