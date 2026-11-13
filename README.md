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

## Optional AI Integration

DevWorkspace supports optional local AI functionality through [Ollama](https://ollama.com/).

Ollama allows users to run large language models locally on their own computers without requiring an external AI API or a cloud-based AI provider.

### Recommended Model

The application is configured to use the following model:

- **Model:** `llama3.2:3b`

### Installation

1. Download and install Ollama from the official website:
   https://ollama.com/download

2. Open a terminal and download the recommended model:

   ```powershell
   ollama pull llama3.2:3b
   ```

3. Verify that the model has been downloaded:

   ```powershell
   ollama list
   ```

4. Make sure the Ollama service is running and accessible to the DevWorkspace backend.

### Configuration

The backend communicates with Ollama through its HTTP API.

The default Ollama endpoint is:

```text
http://host.docker.internal:11434/
```

When using Docker Compose or the local Kubernetes deployment, Ollama runs on the host machine, while the backend runs inside a container.

For this reason, the backend must be able to reach the host machine through the configured endpoint.

On Windows, ensure that Ollama is configured to accept connections from the container environment. If necessary, configure the `OLLAMA_HOST` environment variable to listen on `0.0.0.0:11434`.

### Notes

- Ollama integration is optional.
- The core application can be used without a local AI model.
- AI-related features require Ollama to be running and the recommended model to be downloaded.
- Model execution requires sufficient system memory and processing resources.
- AI response times depend on the hardware and the selected model.

For detailed setup instructions, refer to the deployment guides.

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