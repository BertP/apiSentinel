# API Sentinel

API Sentinel is a sophisticated, spec-driven API monitoring solution designed to provide real-time insights into the health, performance, and reliability of OpenAPI-compliant services.

Specifically tailored for the **Miele MCS3 API**, it automates complex OAuth2 authentication, tracks endpoint latency, and visualizes historical health trends through a stunning glassmorphic dashboard.

## 🚀 Quick Start (Docker)

The fastest way to get API Sentinel running is using Docker Compose.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BertP/apiSimulation.git
   cd apiSimulation
   ```

2. **Configure your environment**:
   ```bash
   cp .env.example .env
   # Open .env and fill in your OAUTH2_CLIENT_ID, OAUTH2_USERNAME, etc.
   ```

3. **Launch the stack**:
   ```bash
   docker compose up -d --build
   ```

4. **Access the Application**:
   - **Frontend Dashboard**: `http://localhost:5173` (or `http://localhost` if using the Docker default)
   - **Backend Swagger UI**: `http://localhost:3000/docs`

## ✨ Core Features

- **Spec-Driven Monitoring**: Automatically discovers and monitors endpoints defined in `openapi.yaml`.
- **Advanced OAuth2 Management**: Handles Password Grant flows, automatic token refreshes, and manual token overrides.
- **Real-Time Data Streams**: Uses Server-Sent Events (SSE) to push monitoring logs to the UI instantly.
- **Glassmorphic UI**: High-performance dashboard with live latency charts, health widgets, and a built-in debug terminal.
- **Periodic Health Verification**: Automated OAuth2 flow verification every 6 hours with detailed success/failure statistics.
- **Containerized Architecture**: Production-ready deployment using PostgreSQL, Redis, and NestJS.

## 📁 Project Structure

```text
apiMonitor/
├── backend/            # NestJS API & Worker logic
├── frontend/           # Vite + React + Tailwind CSS Dashboard
├── .github/workflows/  # CI/CD (GitHub Actions)
├── openapi.yaml        # The source of truth for the monitored API
└── docker-compose.yml  # Orchestration for DB, Redis, and Apps
```

## 🛠️ Tech Stack

- **Backend**: NestJS, Bull (TypeORM + PostgreSQL), Redis, Axios
- **Frontend**: React, Vite, Tailwind CSS, Lucide React, Recharts
- **Infrastructure**: Docker, GitHub Actions

## 📖 Deep Dives

- [**Architecture Guide**](./ARCHITECTURE.md) - How the system components interact.
- [**Deployment Guide**](./DEPLOYMENT.md) - Detailed instructions for production servers.
- [**GitHub Config Guide**](./GITHUB.md) - CI/CD and repository standards.
- [**Backend README**](./backend/README.md) - Information for backend developers.
- [**Frontend README**](./frontend/README.md) - Information for frontend developers.

---

Built with ❤️ for API Reliability.
