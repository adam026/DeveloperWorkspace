# DevWorkspace

**A Personal Developer Workspace for organizing development knowledge, tools, and resources.**

DevWorkspace is a web-based application designed to help software developers organize their everyday development resources in one centralized workspace.

The application provides dedicated modules for managing technical documents, AI prompts, Markdown files, architecture projects, documentation, tasks, and reusable development resources.

## Features

- **Dashboard** – Overview of workspace content and recent activity.
- **Documents** – Store and organize technical documents and development materials.
- **Prompt Library** – Create, manage, and organize reusable AI prompts.
- **Agent & Markdown Generator** – Generate agent instruction files and manage Markdown resources.
- **Architecture Library** – Create and manage software architecture projects and design components.
- **Documentation** – Organize project documentation.
- **Task Manager** – Track development tasks and their progress.
- **Workspace** – Access and manage development resources from a centralized interface.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Angular 21, TypeScript, Bootstrap |
| Backend | ASP.NET Core 10 Web API |
| Database | MongoDB 8 |
| Containerization | Docker, Docker Compose |
| Container Registry | GitHub Container Registry (GHCR) |
| CI/CD | GitHub Actions |
| Orchestration | Kubernetes |
| GitOps | Argo CD |

## Architecture

The application follows a frontend-backend-database architecture.

- **Frontend:** Angular-based user interface served by Nginx.
- **Backend:** ASP.NET Core REST API responsible for application logic and data access.
- **Database:** MongoDB for persistent data storage.
- **Deployment:** Docker containers managed through Docker Compose or Kubernetes.

## Deployment Options

DevWorkspace supports two deployment approaches.

### 1. Kubernetes with Argo CD (Recommended)

The primary deployment approach uses Kubernetes and Argo CD.

The GitHub repository contains the Kubernetes manifests, while Argo CD monitors the repository and synchronizes the desired application state with the Kubernetes cluster.

Docker images are built and published to GitHub Container Registry through GitHub Actions.

See the [Argo CD Deployment Guide](docs/installation/ARGO-CD-DEPLOYMENT.md).

### 2. Docker Compose

For a simpler local deployment, Docker Compose can be used to start the frontend, backend, and MongoDB containers.

See the [Docker Compose Deployment Guide](docs/installation/DOCKER-COMPOSE-DEPLOYMENT.md).

## Repository Structure

```text
DeveloperWorkspace/
├── .github/
│   └── workflows/
│       └── docker-build.yml
├── DeveloperWorkspace.Api/
├── developer-workspace-ui/
├── docs/
│   ├── architecture/
│   └── installation/
├── k8s/
│   ├── namespace.yaml
│   ├── mongodb.yaml
│   ├── backend.yaml
│   ├── frontend.yaml
│   └── argocd-application.yaml
├── docker-compose.yml
└── README.md
```

## Docker Images

The application images are published to GitHub Container Registry:

- Backend: `ghcr.io/adam026/developerworkspace-backend`
- Frontend: `ghcr.io/adam026/developerworkspace-frontend`

Both packages are publicly accessible.

## License

This project was developed as part of a bachelor's thesis.