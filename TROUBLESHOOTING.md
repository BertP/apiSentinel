# 🛠️ Troubleshooting Guide

This guide addresses common issues encountered when running API Sentinel and provides actionable steps to resolve them.

## 1. Miele API Issues

### ❌ Error 401 Unauthorized
- **Cause**: The OAuth2 `access_token` has expired or is invalid.
- **Solution**:
    1. Check if `OAUTH2_PASSWORD` in `.env` is correct.
    2. Click "Refresh Token" in the Dashboard Settings.
    3. Verify that your Miele Developer Account hasn't expired.

### ❌ Error 403 Forbidden
- **Cause**: Your Client ID/Secret is valid, but you don't have permission for this specific endpoint.
- **Solution**: Ensure you have linked your Miele environment correctly in the Miele Developer Portal.

---

## 2. Real-time Monitoring (SSE)

### ⚠️ Live Terminal is Empty
- **Cause**: The SSE stream hasn't been started or Nginx is buffering the response.
- **Solution**:
    1. Click "Start Stream" in the Live Monitor tab.
    2. If using Nginx, ensure `proxy_buffering off;` is set (see [Deployment Guide](./DEPLOYMENT.md#ssl-tls-with-nginx)).

### ⚠️ Stream Disconnects Frequently
- **Cause**: Network timeout or Miele server-side connection limit.
- **Solution**: API Sentinel includes auto-reconnect logic (exponential backoff). Check the "Debug Console" at the bottom of the screen to see reconnect attempts.

---

## 3. Dashboard & UI

### 👻 "Zombie" Monitoring Cards
- **Cause**: Deleted cards still showing due to local cache sync delays.
- **Solution**: Refresh the browser (F5). If the card persists, check the server logs: `docker compose logs backend`.

### 📉 Latency Charts are Flat/Red
- **Cause**: The backend polling engine is failing to reach the Miele API.
- **Solution**: 
    - Check host internet connectivity.
    - Verify that the `MONITOR_INTERVAL_MS` is not set too low (Miele might rate-limit if less than 10s).

---

## 4. Notifications (Email)

### ✉️ Test Email Fails
- **Cause**: Incorrect SMTP settings.
- **Solution**:
    - Verify `MAIL_HOST`, `MAIL_PORT`, and `MAIL_USER` in `.env`.
    - Note that many providers (like Gmail) require "App Passwords" rather than your main account password.

---

## 🐳 5. Docker Issues

### 🛑 Container "backend" is RESTARTING
- **Cause**: Usually a failure to connect to the database or Redis.
- **Solution**: Run `docker compose logs backend` to see the exact stack trace. Common fixes include ensuring `REDIS_HOST=redis` and `DATABASE_URL` uses `db:5432`.
