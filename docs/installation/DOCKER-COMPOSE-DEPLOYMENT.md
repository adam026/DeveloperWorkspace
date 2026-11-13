# DevWorkspace – Docker Compose Deployment Guide

This guide describes how to run DevWorkspace locally using Docker Compose.

Docker Compose provides a simple deployment alternative without requiring Kubernetes or Argo CD.

The application consists of three main services:

- **Frontend:** Angular application served by Nginx.
- **Backend:** ASP.NET Core Web API.
- **Database:** MongoDB.

## 1. Prerequisites

Make sure the following tools are installed:

| Tool | Purpose |
|---|---|
| Git | Clone the source repository |
| Docker Desktop | Build and run containers |
| Docker Compose | Manage the application services |
| PowerShell | Execute deployment commands |
| Web browser | Access the application |

An internet connection is required to download the Docker images and dependencies during the initial build.

## 2. Clone the Repository

Open PowerShell and clone the repository:

```powershell
git clone https://github.com/adam026/DeveloperWorkspace.git
```

Navigate to the project directory:

```powershell
cd DeveloperWorkspace
```

## 3. Start the Application

Make sure Docker Desktop is running.

From the project root directory, execute:

```powershell
docker compose up -d --build
```

This command builds the frontend and backend Docker images and starts all application services in the background.

The MongoDB service uses a persistent Docker volume to store database files.

## 4. Verify the Services

Check the running containers:

```powershell
docker compose ps
```

The following services should be running:

| Service | Container | Port |
|---|---|---|
| Frontend | developerworkspace-frontend | 4200 |
| Backend | developerworkspace-backend | 8080 |
| MongoDB | developerworkspace-mongodb | 27017 |

Check the application logs if necessary:

```powershell
docker compose logs -f
```

To inspect a specific service:

```powershell
docker compose logs -f backend
```

## 5. Access the Application

Open the following address in a web browser:

http://localhost:4200

The Angular frontend communicates with the backend through the configured Nginx reverse proxy.

The backend API is also available locally on port 8080.

## 6. Persistent Database Storage

MongoDB data is stored in the named Docker volume `mongodb_data`, declared in `docker-compose.yml`.

Docker Compose automatically prefixes the volume name with the project name. With the default project name for this repository, the resulting volume name is:

`developerworkspace_mongodb_data`

The volume persists when containers are stopped or removed.

To stop the application without deleting the database:

```powershell
docker compose down
```

To stop the application and delete the database volume:

```powershell
docker compose down -v
```

**Warning**: The -v option permanently deletes the MongoDB data stored in the Compose volume. Do not use it if you want to preserve your application data.

To start it again:

```powershell
docker compose up -d
```

**Important:** Do not use `docker compose down -v` if you want to preserve the database contents. The `-v` option removes the associated named volumes.

## 7. Optional: Local AI Integration with Ollama

DevWorkspace supports optional AI functionality through Ollama.

Ollama runs independently on the host machine, while the backend communicates with it through Docker networking.

### 7.1 Install Ollama

Download and install Ollama:

https://ollama.com/download

Start Ollama and open PowerShell.

Download the recommended model:

```powershell
ollama pull llama3.2:3b
```

Verify the installed model:

```powershell
ollama list
```

### 7.2 Configure Network Access

The backend container uses the following Ollama endpoint:

```text
http://host.docker.internal:11434/
```

On Windows, Docker Desktop provides the `host.docker.internal` hostname to allow containers to access services running on the host machine.

If Ollama is not accessible from the backend container, check its network configuration.

If necessary, configure Ollama to listen on an interface accessible from Docker containers:

```powershell
$env:OLLAMA_HOST = "0.0.0.0:11434"
```

Restart Ollama after changing the environment variable.

**Security note:** Listening on `0.0.0.0` may expose the Ollama API to other devices on the network. Only use this configuration on trusted networks and apply appropriate firewall restrictions.

### 7.3 Verify Ollama

Check whether Ollama is responding:

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
```

If the backend cannot communicate with Ollama, inspect the backend logs:

```powershell
docker compose logs -f backend
```

### 7.4 Test AI Functionality

Open the DevWorkspace application and navigate to an AI-supported feature.

Verify that the local model responds correctly.

Ollama is optional. The other application modules remain available without it.

## 8. Stopping the Application

To stop and remove the application containers and network:

```powershell
docker compose down
```

The MongoDB named volume is preserved.

To start the application again:

```powershell
docker compose up -d
```

## 9. Troubleshooting

### Port already in use

If Docker cannot bind a required port, check whether another application is already using it.

The default ports are:

- Frontend: 4200
- Backend: 8080
- MongoDB: 27017

Stop the conflicting application or adjust the port mappings in `docker-compose.yml`.

### Backend cannot connect to MongoDB

Check whether MongoDB is running:

```powershell
docker compose ps
```

Inspect MongoDB logs:

```powershell
docker compose logs mongodb
```

### Frontend cannot communicate with the backend

Inspect the frontend Nginx configuration and backend logs:

```powershell
docker compose logs frontend
docker compose logs backend
```

### AI functionality is unavailable

Verify that Ollama is running, the recommended model is installed, and the backend can reach the Ollama API.

## 10. Important Notes

- Docker Compose is an alternative to the Kubernetes and Argo CD deployment method.
- Database contents are stored in a persistent Docker volume.
- The initial database is empty unless existing data is imported.
- Ollama and its language model are optional and are not included in the application containers.
- This deployment is intended for local development and demonstration purposes, not production hosting.