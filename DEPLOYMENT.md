# 🐧 Ubuntu Server Deployment Guide

This guide provides a comprehensive walkthrough for deploying **API Sentinel** on a fresh Ubuntu Server (22.04 or 24.04 LTS).

## 📋 Table of Contents
1. [System Preparation](#1-system-preparation)
2. [Install Docker & Docker Compose](#2-install-docker--docker-compose)
3. [Project Setup](#3-project-setup)
4. [Security & Firewall](#4-security--firewall)
5. [Maintenance & Monitoring](#5-maintenance--monitoring)

---

## 1. System Preparation

First, ensure your system is up to date:

```bash
sudo apt update && sudo apt upgrade -y
```

> [!TIP]
> If your server has less than 2GB of RAM, consider creating a swap file to prevent out-of-memory errors during Docker builds:
> ```bash
> sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
> sudo mkswap /swapfile && sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

# Redis Optimization (Memory Overcommit)
echo 'vm.overcommit_memory = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.overcommit_memory=1

## 2. Install Docker & Docker Compose

Run the following commands to install the latest official Docker engine:

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
```

### Post-Install Step
Allow your user to run Docker commands without `sudo`:
```bash
sudo usermod -aG docker $USER
# IMPORTANT: Log out and log back in for this to take effect!
```

## 3. Project Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BertP/apiMonitor.git ~/apiMonitor
   cd ~/apiMonitor
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   *Edit the OAuth2 credentials and your PostgreSQL connection strings if necessary.*

3. **Launch the Stack**:
   ```bash
   docker compose up -d --build
   ```

## 4. Security & Firewall (UFW)

Ubuntu comes with `ufw` (Uncomplicated Firewall). Configure it to allow only necessary traffic:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp # Backend API
sudo ufw enable
```

## 5. Maintenance & Operations

### Docker Housekeeping
To prevent logs from consuming all disk space, implement a log rotation policy in your `docker-compose.yml`:
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Essential Commands
- **Check Status**: `docker compose ps`
- **View Live Logs**: `docker compose logs -f backend`
- **Update Application**:
  ```bash
  git pull
  docker compose up -d --build
  ```

---

## 🛡️ 6. Production Hardening

### SSL/TLS with Nginx
For production, always serve API Sentinel over HTTPS. Below is a sample configuration for an Nginx reverse proxy using Let's Encrypt:

```nginx
server {
    listen 443 ssl;
    server_name monitor.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5173; # Frontend
    }

    location /monitor/events {
        proxy_pass http://localhost:3000; # Backend SSE
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }

    location /docs {
        proxy_pass http://localhost:3000; # Swagger
    }
}
```

### Database Backups
Automate daily backups of your monitoring data:
```bash
docker exec -t api_monitor_db pg_dumpall -c -U api_monitor > dump_$(date +%Y-%m-%d).sql
```

---

## ⚙️ 7. Environment Configuration (.env)

The `.env` file is critical as it contains database credentials and sensitive OAuth2 secrets for the Miele API.

### Essential Variables

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Connection string for PostgreSQL. Inside Docker, use `postgresql://api_monitor:password@db:5432/api_sentinel`. |
| `REDIS_HOST` | Set to `redis` for Docker deployments. |
| `OAUTH2_CLIENT_ID` | Your Miele Developer Client ID. |
| `OAUTH2_CLIENT_SECRET` | Your Miele Developer Client Secret. |
| `OAUTH2_USERNAME` | Your Miele Account email. |
| `OAUTH2_PASSWORD` | Your Miele Account password. |
| `MONITOR_INTERVAL_MS` | How often to poll endpoints (e.g., `60000` for 1 minute). |

### Security Best Practices
> [!CAUTION]
> **Never commit your `.env` file to version control.** It is already listed in `.gitignore`. For production, ensure the file permissions are restricted:
> ```bash
> chmod 600 .env
> ```

---

## 🩺 8. Monitoring the Monitor

You can verify the health of API Sentinel itself via these internal endpoints:
- **Backend Liveness**: `GET http://localhost:3000/monitor/health`
- **Auth Status**: Check the "Security" icon in the Dashboard sidebar.
- **Queue Health**: `GET http://localhost:3000/monitor/stats`
