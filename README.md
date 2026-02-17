# API Sentinel

API Sentinel is a sophisticated, spec-driven API monitoring solution designed to provide real-time insights into the health, performance, and reliability of OpenAPI-compliant services.

Specifically tailored for the **Miele MCS3 API**, it automates complex OAuth2 authentication, tracks endpoint latency, and visualizes historical health trends through a stunning glassmorphic dashboard.

## 🚀 Quick Start (Docker)

The fastest way to get API Sentinel running is using Docker Compose.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BertP/apiMonitor.git
   cd apiMonitor
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

- **Live SSE Monitor**: A dedicated, real-time terminal window for tracking raw Server-Sent Events with sub-millisecond latency.
- **Spec-Driven Monitoring**: Automatically discovers and monitors endpoints defined in `openapi.yaml`, natively supporting Miele MCS3 parameters.
- **Interactive Dashboard**: Real-time performance metrics (latency, health, status) with the ability to dynamically manage (add/delete) monitoring cards.
- **Account Overview**: A specialized view for managing and inspecting all Miele devices registered to the account.
- **Advanced OAuth2 Management**: Multi-tier auth handling with automatic token refreshes, manual overrides, and periodic health verification.
- **Dynamic Parameter Injection**: Automatically replaces `{deviceId}` placeholders in request paths using your globally configured device ID.
- **High-Performance Architecture**: Optimized for scale with PostgreSQL indexing, SQL aggregations, and real-time SSE log synchronization.

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
