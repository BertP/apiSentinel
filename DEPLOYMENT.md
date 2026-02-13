# Deployment Guide: Production Environment

This guide explains how to deploy the full **API Sentinel** stack to a production server (e.g., Ubuntu).

## 🛠️ Prerequisites

- **Docker & Docker Compose**
- **Public Domain** (or Static IP)
- **SSL Certificate** (Recommended for production)

## 📦 Deployment Steps

### 1. Clone & Configure

```bash
git clone https://github.com/BertP/apiSimulation.git /opt/apiMonitor
cd /opt/apiMonitor
cp .env.example .env
nano .env # update your credentials!
```

### 2. Launch with Docker Compose

The `docker-compose.yml` file is configured to orchestrate everything:

```bash
docker compose up -d --build
```

### 3. Verification

- **Dashboard**: `http://your-server-ip`
- **Backend API**: `http://your-server-ip:3000`
- **Logs**: `docker compose logs -f`

## 🏗️ Docker Architecture Detail

- **PostgreSQL**: Stores logs and auth statistics on a named volume `postgres_data`.
- **Redis**: Acts as the worker queue broker.
- **Backend**: Auto-syncs `openapi.yaml` and executes monitoring jobs.
- **Frontend**: Served via Nginx on port 80.

## 🛡️ Production Recommendations

### Security
- **Fail2Ban**: Install to protect SSH and API ports.
- **Firewall**: Ensure only ports 80, 443, and 3000 (if needed) are open.

### Monitoring the Monitor
- Periodically check the **OAuth2 Health Widget** in the dashboard to ensure the backend can still reach the target Miele API.
- Check `docker compose logs -f backend` for any parsing errors if the `openapi.yaml` is modified.

## 🔄 Updates

To update the application:
```bash
git pull origin main
docker compose up -d --build
```
