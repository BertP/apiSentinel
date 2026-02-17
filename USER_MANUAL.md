# 📖 User Manual: API Sentinel

Welcome to API Sentinel! This guide will help you navigate and master your new API monitoring dashboard.

---

## 🚦 Polling vs. Live Monitoring

API Sentinel uses two distinct methods to keep tabs on your Miele appliances:

| Method | Description | Best For |
| :--- | :--- | :--- |
| **Polling** | Regular checks (e.g., every 60s) of specific REST endpoints. | Trends, Latency, & Historical Health. |
| **Live Monitoring** | Persistent SSE streams for real-time state changes. | Instant Feedback & Interaction Debugging. |

---

## 🎛️ 1. The Dashboard
The Dashboard is your nerve center. It displays "Request Cards" for every endpoint you are monitoring.

### 📊 Reading a Request Card
- **Latency Chart**: Shows the last 20 requests. Blue glows mean healthy response times.
- **Uptime Bar**: A visual indicator of success vs. failure rates.
- **Status Code**: The large number on the right shows the HTTP response from the last check.
- **Avg Latency**: The big number on the left is the rolling average response time.

> [!TIP]
> **Pro Tip**: Click on any chart or status code to open the **Payload Inspector**, where you can see the exact JSON sent and received.

### 🗑️ Removing a Card
Hover over any card and click the 🗑️ **Trash** icon in the top-right corner to stop monitoring that endpoint immediately.

---

## ⚙️ 2. Configuration & Setup
Click the ⚙️ **Settings** button in the sidebar to open the configuration panel.

### 🔑 Authentication
- **OAuth Status**: View your current access token and expiration time.
- **Manual Override**: Paste a specific access token here to bypass the automatic OAuth2 flow.

### 🆔 Target Device ID
Enter your Miele **Device ID** (e.g., `000123456789`) in the settings. API Sentinel will automatically replace any `{deviceId}` placeholders in request paths with this value.

> [!IMPORTANT]
> Change the Device ID globally to switch monitoring focus between different appliances without re-adding endpoints.

---

## 🛰️ 3. Live Monitoring
The **Live Monitor** tab is designed for high-intensity, persistent tracking.

### 📟 Live SSE Terminal
- Click **Open Live Terminal** to launch a standalone, terminal-style window.
- This window is perfect for a second monitor—it pipes raw JSON events directly from Miele as they happen.
- Use **Start Stream** to begin the feed.

---

## 📱 4. Device Management
The **Devices** tab provides a real-time list of all appliances connected to your Miele account.

- **Inventory**: See device names, types, and serial numbers (`fabNumber`).
- **Sorting**: The list is automatically sorted by device type for easy navigation.

---

## 📬 5. Alerts & Reports
- **Real-time Alerts**: If an alert-enabled endpoint fails 5 times in a row, API Sentinel will email your configured recipients.
- **Daily Reports**: Every 24 hours, you'll receive a summary report of all activity and success rates.

---

## 📚 6. Deep Dives & Troubleshooting
For more advanced information, refer to:
- [**Architecture Guide](./ARCHITECTURE.md)**: How the systems work under the hood.
- [**Troubleshooting Guide](./TROUBLESHOOTING.md)**: Common errors and fixes.

---
*Built for precision. Built for reliability. Built for you.*
