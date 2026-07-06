# System Monitor

A real-time system monitoring application with a Python Flask backend and React frontend. This application tracks CPU, memory, and disk usage with auto-refreshing gauges that update every 2 seconds.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Docker Deployment](#docker-deployment)
  - [Docker Compose](#docker-compose)
- [CI/CD Pipelines](#cicd-pipelines)
  - [Docker Build Pipeline](#docker-build-pipeline)
  - [Matrix Strategy Docker Build and Push Pipeline](#matrix-strategy-docker-build-and-push-pipeline)
  - [Setting Up the Pipelines](#setting-up-the-pipelines)
  - [Monitoring Pipeline Runs](#monitoring-pipeline-runs)
  - [Manual Trigger](#manual-trigger)
  - [Pipeline Comparison](#pipeline-comparison)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Contributing](#contributing)

---

## Overview

System Monitor is a full-stack application designed to provide real-time insights into system resource utilization. It consists of:

- **Backend**: Flask REST API that collects system metrics (CPU, memory, disk)
- **Frontend**: React-based UI that displays metrics 
- **Container Setup**: Docker and Docker Compose for containerized deployment

<img width="1144" height="503" alt="Screenshot 2026-07-06 at 20 41 25" src="https://github.com/user-attachments/assets/a3bd6872-9939-4158-8b17-a9fc0f0f8817" />

### Key Features

- Real-time CPU usage monitoring
- Memory consumption tracking
- Disk space utilization
- Container-ready with Docker support
- Github Workflows pipeline to create docker images from Dockerfile and push to dockerhub

---

## Architecture

```
┌─────────────────────────────────────────────┐
│ React Frontend                              │
│ (Port 3000 / Nginx)                         │
└──────────────┬──────────────────────────────┘
               │ 
               │
┌──────────────▼──────────────────────────────┐
│ Flask Backend API                           │
│ (Port 5000 - internal)                      │
└─────────────────────────────────────────────┘
               │
               │ System Metrics (psutil)
               │
┌──────────────▼──────────────────────────────┐
│ Operating System                            │
│ (CPU, Memory, Disk)                         │
└─────────────────────────────────────────────┘
```

---

## Prerequisites

### For Local Development

- Python 
- Node.js 
- npm (comes with Node.js)

### For Docker Deployment

- Docker 
- Docker Compose 

---

## Local Development

### Backend Setup

Navigate to backend directory:

```bash
cd backend
```

Create virtual environment:

```bash
python -m venv venv
```

Activate environment:

**macOS/Linux**
```bash
source venv/bin/activate
```

**Windows**
```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run backend:

```bash
python app.py
```

Backend runs at:
```
http://localhost:5000
```

---

### API Endpoint

#### GET /api/stats

Returns system metrics.

Example response:

```json
{
  "cpu": {
    "percent": 25.5,
    "cores": 8
  },
  "memory": {
    "total": 17179869184,
    "used": 8589934592,
    "percent": 50.0
  },
  "disk": {
    "total": 536870912000,
    "used": 268435456000,
    "percent": 50.0
  }
}
```

---

### Frontend Setup

Navigate to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm start
```

Frontend runs at:
```
http://localhost:3000
```

---

### Production Build

```bash
npm run build
```

Output folder:
```
frontend/build/
```

---

## Docker Deployment

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5000

CMD ["python", "app.py"]
```

**Features:**
- Lightweight base image
- Non-root user for security
- Minimal attack surface

---

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Features:**
- Multi-stage build
- Optimized production image
- Nginx static hosting

---

### Docker Compose

```yaml
version: "3.9"

services:
  backend:
    build:
      context: ./backend
    container_name: backend
    command: python app.py
    networks:
      - app-network

  nginx-frontend:
    build:
      context: ./frontend
    container_name: nginx-frontend
    ports:
      - "3000:80"
    volumes:
      - ./system-monitor.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

### Deployment Steps

Clone repo:

```bash
git clone https://github.com/PrasiddhaBhattarai/system-monitor.git
cd system-monitor
```

Start services:

```bash
docker-compose up --build
```

Access:

- Frontend: http://localhost:3000
- Backend API (via proxy): http://localhost:3000/api/stats

Stop services:

```bash
docker-compose down
```

---

### Useful Docker Commands

View containers:

```bash
docker-compose ps
```

View logs:

```bash
docker-compose logs -f [service-name]
```

Rebuild:

```bash
docker-compose build --no-cache
```

Clean up:

```bash
docker-compose down -v
```

---

# CI/CD Pipelines

This project includes GitHub Actions workflows for automated Docker image building and deployment. Two pipeline strategies are available depending on your deployment requirements.

---

## Docker Build Pipeline

**Workflow File:** `.github/workflows/docker-build-push.yml`

A sequential pipeline that builds both frontend and backend Docker images independently without pushing them to Docker Hub.

### Triggers

- Push to `master` branch
- Pull requests targeting the `master` branch
- Manual workflow dispatch

### Jobs

#### `build-frontend`

Builds the frontend Nginx image containing the React application.

```yaml
- Checkout repository code
- Set up Docker Buildx for cross-platform builds
- Build frontend image (tag: nginx-frontend:latest)
- No push to registry (local validation only)
```

#### `build-backend`

Builds the backend Python Flask image.

```yaml
- Checkout repository code
- Set up Docker Buildx for cross-platform builds
- Build backend image (tag: backend:latest)
- No push to registry (local validation only)
```

### Use Case

Validate Docker image builds during pull requests without publishing images to Docker Hub. This helps ensure Docker build integrity before merging into the `master` branch.

### Prerequisites

None. This workflow performs local image builds only.

---

## Matrix Strategy Docker Build and Push Pipeline

**Workflow File:** `.github/workflows/docker-build-push-matrix.yml`

An efficient parallel pipeline that uses GitHub Actions matrix strategy to build and push both frontend and backend Docker images to Docker Hub while sending Slack notifications.

### Triggers

- Push to `master` branch
- Pull requests targeting the `master` branch
- Manual workflow dispatch

### Matrix Configuration

| Name | Context | Dockerfile | Image |
|------|---------|------------|-------|
| frontend | `./frontend` | `./frontend/Dockerfile` | `nginx-frontend` |
| backend | `./backend` | `./backend/Dockerfile` | `backend` |

### Jobs

### `build-and-push`

Builds and pushes Docker images for each matrix entry in parallel.

### Steps

1. **Checkout Repository**
   - Retrieves the latest source code.

2. **Set Up Docker Buildx**
   - Enables advanced Docker build features and caching.

3. **Login to Docker Hub**
   - Authenticates using GitHub repository secrets:
     - `DOCKERHUB_USERNAME`
     - `DOCKERHUB_TOKEN`

4. **Build and Push**
   - Builds Docker images.
   - Pushes two image tags:
     - `username/image:latest`
     - `username/image:<run-number>`

5. **Slack Notification (Success)**
   - Sends a success notification after a successful build.
   - Example message:

```text
Successfully Built and Pushed Docker image: username/image:42
```

6. **Slack Notification (Failure)**
   - Sends a failure notification if any step in the workflow fails.

### Image Tags

Each image is tagged with both a rolling `latest` tag and a unique build number.

```text
nginx-frontend:latest
nginx-frontend:42

backend:latest
backend:42
```

### Use Case

Automate production deployments by building and publishing versioned Docker images to Docker Hub. The build-number tags make rollbacks easy while the `latest` tag always references the newest successful build.

---

## Setting Up the Pipelines

### Required Secrets

To enable the **Matrix Strategy Docker Build and Push Pipeline**, configure the following GitHub repository secrets.

Navigate to:

```text
Settings → Secrets and variables → Actions
```

| Secret | Description |
|---------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL for notifications |

### Configuration Steps

1. Go to **Repository Settings**
2. Select **Secrets and variables**
3. Click **Actions**
4. Click **New repository secret**
5. Add each required secret
6. Click **Add secret**

---

## Monitoring Pipeline Runs

To monitor workflow execution:

1. Open the **Actions** tab in your GitHub repository.
2. Select the desired workflow.
3. Click a workflow run to view:
   - Real-time logs
   - Job status
   - Step-by-step execution
   - Workflow artifacts
   - Build results

Repository Actions page:

```text
https://github.com/PrasiddhaBhattarai/system-monitor/actions
```

---

## Manual Trigger

Run a workflow manually without pushing code.

#### Steps

1. Navigate to **Actions**
2. Select the workflow
3. Click **Run workflow**
4. Select the target branch
5. Click **Run workflow**

---

## Pipeline Comparison

| Feature | Docker Build Pipeline | Matrix Build & Push Pipeline |
|----------|----------------------|------------------------------|
| Parallel Builds | ❌ Sequential | ✅ Yes |
| Pushes to Docker Hub | ❌ No | ✅ Yes |
| Versioned Image Tags | ❌ No | ✅ Yes |
| Slack Notifications | ❌ No | ✅ Yes |
| Primary Use Case | Pull Request Validation | Production Deployment |
| Typical Duration | ~2–3 minutes | ~2–3 minutes (parallel) |

---

## API Documentation

### GET /api/stats

Returns real-time system statistics.

| Field | Description |
|------|-------------|
| cpu.percent | CPU usage percentage |
| cpu.cores | Number of CPU cores |
| memory.total | Total memory (bytes) |
| memory.used | Used memory (bytes) |
| memory.percent | Memory usage (%) |
| disk.total | Total disk space (bytes) |
| disk.used | Used disk space (bytes) |
| disk.percent | Disk usage (%) |

---

## Project Structure

```
system-monitor/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── system-monitor.conf
└── README.md
```

---

## Technologies

### Backend
- Flask 3.1.1
- Flask-CORS 5.0.1
- psutil 6.1.1
- Python 3.11

### Frontend
- React 18.3.1
- React DOM 18.3.1
- React Scripts 5.0.1
- Node.js 20

### Infrastructure
- Docker
- Docker Compose
- Nginx

---

## Contributing

1. Fork repository
2. Create branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit changes:
   ```bash
   git commit -m "Add amazing feature"
   ```
4. Push branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open Pull Request

---
