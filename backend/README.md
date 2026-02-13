# API Sentinel - Backend

The API Sentinel backend is built with **NestJS**, a progressive Node.js framework for building efficient, reliable, and scalable server-side applications.

## 🛠️ Architecture Highlights

- **Bull & Redis**: Asynchronous monitoring jobs with retry logic.
- **TypeORM & PostgreSQL**: Persistent storage for monitoring and authentication logs.
- **Server-Sent Events (SSE)**: Real-time event streaming to the frontend.
- **OpenAPI Integration**: Dynamic endpoint discovery from a YAML spec.

## ⚙️ Configuration

The backend is configured via environment variables. See the root `.env.example` for details.

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | The port the API listens on | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/api_sentinel` |
| `REDIS_HOST` | Redis server hostname | `localhost` |
| `MONITOR_INTERVAL_MS` | Default interval for monitoring tasks | `60000` (1 min) |
| `OAUTH2_*` | Credentials for the Miele API | |

## 🚀 Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run start:dev
   ```

3. **Access API Docs**:
   Once running, visit `http://localhost:3000/docs` to see the Swagger UI.

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration (e2e) tests
npm run test:e2e
```

## 🏗️ Docker Build

The backend includes a multi-stage `Dockerfile` that builds the application and provides a lightweight production image.

```bash
docker build -t api-sentinel-backend .
```
