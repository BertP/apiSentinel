# GitHub Configuration & CI/CD Guide

This document explains the GitHub-specific setup for the API Sentinel project, including CI/CD workflows and repository standards.

## 🛠️ CI/CD Pipeline

The project uses **GitHub Actions** for automated building and verification. The configuration is located in [`.github/workflows/ci.yml`](file:///c:/Users/bertp/work/Antigravity/apiMonitor/.github/workflows/ci.yml).

### Workflow: API Sentinel CI/CD
- **Trigger**: Runs on every `push` to the `main` branch.
- **Environment**: `ubuntu-latest`
- **Steps**:
  1. **Checkout**: Pulls the latest code from the repository.
  2. **Node.js Setup**: Configures Node.js v18.
  3. **Backend Build**:
     - Installs dependencies in the `backend/` directory.
     - Runs `npm run build` to ensure no compilation errors.
  4. **Frontend Build**:
     - Installs dependencies in the `frontend/` directory.
     - Runs `npm run build` to verify the production bundle (Vite + React).
  5. **Docker Build**:
     - Executes `docker compose build` to verify that all images (backend, frontend) can be created successfully using the local Dockerfiles.

## 📁 Repository Structure & Standard Files

### `.gitignore`
Standard ignore patterns are implemented at the root and within sub-projects to prevent sensitive data or build artifacts from being committed:
- **Root**: Ignores `.env`, `node_modules`, and OS-specific files.
- **Backend/Frontend**: Ignore `dist/`, build logs, and local configuration.

### Deployment Preparedness
The root [`.dockerignore`](file:///c:/Users/bertp/work/Antigravity/apiMonitor/.dockerignore) ensures that only necessary source files are sent to the Docker daemon during builds, keeping image sizes small and preventing secret leaks.

## 🌿 Branching Strategy

- **`main`**: The stable branch. CI/CD runs automatically here. All production-ready code should be merged into `main`.
- **Feature Branches**: It is recommended to develop new features in separate branches (e.g., `feature/oauth-stats`) and merge them into `main` via Pull Requests.

## 🔑 Secret Management

**CRITICAL**: Never commit `.env` files to the repository. 
- Use [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) if you need to pass sensitive data to CI/CD workflows.
- For production deployment, manually create the `.env` file on the server as described in [DEPLOYMENT.md](file:///c:/Users/bertp/work/Antigravity/apiMonitor/DEPLOYMENT.md).
