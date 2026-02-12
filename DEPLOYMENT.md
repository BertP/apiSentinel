# Deployment Guide: Ubuntu Server

Follow these steps to deploy **API Sentinel Monitor** on your Ubuntu Server.

## Prerequisites
Ensure your server has the following installed:
- **Docker**: [Installation Guide](https://docs.docker.com/engine/install/ubuntu/)
- **Docker Compose**: Usually included with Docker Desktop, or install via `sudo apt install docker-compose-v2`

## 1. Prepare Target Directory
The application is configured to run from `/opt/apiMonitor`.

```bash
sudo mkdir -p /opt/apiMonitor
sudo chown $USER:$USER /opt/apiMonitor
cd /opt/apiMonitor
```

## 2. Clone/Copy Project
Clone the repository or copy the project files to the target directory.

```bash
git clone https://github.com/BertP/apiMonitor .
```

## 3. Configure Environment
Create the `.env` file from the provided example.

```bash
cp .env.example .env
nano .env # Update with your specific credentials and URLs
```

> [!IMPORTANT]
> Ensure `DB_PASSWORD` and `OAUTH2` credentials in `.env` match your target environment.

## 4. Launch with Docker Compose
The `docker-compose.yml` is configured for production-ready service orchestration.

```bash
docker compose up -d --build
```

## 5. Verify Deployment
Check the status of the containers:

```bash
docker compose ps
```

The application should be accessible at:
- **Frontend**: `http://<server-ip>`
- **Backend API**: `http://<server-ip>:3000`

## Container Management
- **View Logs**: `docker compose logs -f`
- **Restart Services**: `docker compose restart`
- **Stop Application**: `docker compose down`
