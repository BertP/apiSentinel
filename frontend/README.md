# API Sentinel - Frontend

The API Sentinel frontend is a high-performance React application built with **Vite** and **Tailwind CSS**. It provides a real-time monitoring dashboard with glassmorphic aesthetics.

## ✨ Features

- **Real-time Dashboard**: Live latency charts and status indicators.
- **Debug Terminal**: A streaming log view powered by Backend SSE.
- **Dynamic Config**: Toggle endpoints and manage OAuth2 credentials on the fly.
- **Mobile Responsive**: Fully adaptive layout for desktop and tablet views.

## 🛠️ Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Icons**: Lucide React
- **API Client**: Axios

## 🚀 Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   Navigate to `http://localhost:5173`.

## 🏗️ Structure

- `src/App.tsx`: Main application shell and state management.
- `src/components/`:
  - `AuthHealthWidget.tsx`: Displays OAuth2 login health and success rates.
  - `ConfigPanel.tsx`: Endpoint and token configuration modal.
  - `DebugTerminal.tsx`: Live SSE log stream component.

## 🚢 Building for Production

```bash
npm run build
```
The output will be in the `dist` directory, ready to be served by Nginx (per the `Dockerfile`).
