# DevWorkspace – Kubernetes and Argo CD Deployment Guide

This guide describes how to deploy DevWorkspace locally using Docker Desktop, Kubernetes, and Argo CD.

This is the recommended deployment method. Argo CD continuously monitors the GitHub repository and automatically synchronizes Kubernetes resources with the configuration stored in Git.

## 1. Prerequisites

Make sure the following tools are installed:

| Tool | Purpose |
|---|---|
| Git | Clone the source repository |
| Docker Desktop | Run containers and the local Kubernetes cluster |
| Kubernetes | Orchestrate application containers |
| kubectl | Manage Kubernetes resources |
| PowerShell | Execute deployment commands |
| Web browser | Access the application and Argo CD |

The following resources are also required:

- Internet connection.
- Access to the public GitHub repository.
- Sufficient system resources for Docker Desktop and Kubernetes.

The application Docker images are publicly available in GitHub Container Registry (GHCR), so a separate registry login is not required.

## 2. Clone the Repository

Open PowerShell and clone the repository:

```powershell
git clone https://github.com/adam026/DeveloperWorkspace.git
```

Navigate to the project directory:

```powershell
cd DeveloperWorkspace
```

## 3. Enable Kubernetes in Docker Desktop

1. Start Docker Desktop.
2. Open Settings.
3. Navigate to the Kubernetes section.
4. Enable Kubernetes.
5. Apply the changes and wait until the cluster is running.

Verify the Kubernetes connection:

```powershell
kubectl get nodes
```

The expected result should contain a node with the `Ready` status.

## 4. Deploy the DevWorkspace Kubernetes Resources

The Kubernetes configuration files are located in the `k8s` directory.

First, apply the namespace:

```powershell
kubectl apply -f ./k8s/namespace.yaml
```

Next, deploy MongoDB:

```powershell
kubectl apply -f ./k8s/mongodb.yaml
```

Deploy the backend:

```powershell
kubectl apply -f ./k8s/backend.yaml
```

Deploy the frontend:

```powershell
kubectl apply -f ./k8s/frontend.yaml
```

Check the deployment status:

```powershell
kubectl get pods -n developerworkspace
```

Wait until the backend, frontend, and MongoDB Pods are in the `Running` state and report `1/1` readiness.

Check the Services:

```powershell
kubectl get services -n developerworkspace
```

MongoDB uses a PersistentVolumeClaim to store database files. This allows the database data to persist across ordinary Pod restarts.

## 5. Install Argo CD

Create the Argo CD namespace:

```powershell
kubectl create namespace argocd
```

Install Argo CD using its official installation manifest:

```powershell
kubectl apply --server-side --force-conflicts -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Wait for the Argo CD Pods to start:

```powershell
kubectl get pods -n argocd
```

All required Pods should eventually report the `Running` status and `1/1` readiness.

## 6. Access the Argo CD Web Interface

Open a separate PowerShell window and start port forwarding:

```powershell
kubectl port-forward svc/argocd-server -n argocd 8081:443
```

Keep this terminal window open.

Open the following address in a web browser:

https://localhost:8081

The browser may display a certificate warning because the local Argo CD endpoint uses a locally generated TLS certificate.

### Initial Login

Username:

```text
admin
```

Retrieve the initial password using PowerShell:

```powershell
$secret = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($secret))
```

Use the displayed password to sign in.

Change the initial administrator password after the first login.

## 7. Deploy the DevWorkspace Argo CD Application

Return to the project root directory in PowerShell.

Apply the Argo CD Application manifest:

```powershell
kubectl apply -f ./k8s/argocd-application.yaml
```

This creates the `developerworkspace` Application in Argo CD.

The Application configuration points to:

- Repository: `https://github.com/adam026/DeveloperWorkspace.git`
- Branch: `master`
- Manifest directory: `k8s`
- Kubernetes namespace: `developerworkspace`

Argo CD monitors the repository and automatically synchronizes changes according to the configured synchronization policy.

## 8. Verify the Deployment

Check the Application status:

```powershell
kubectl get application developerworkspace -n argocd
```

The expected status is:

- Sync Status: `Synced`
- Health Status: `Healthy`

Open the Argo CD interface and select the `developerworkspace` Application to inspect its Kubernetes resources.

Check the application Pods:

```powershell
kubectl get pods -n developerworkspace
```

## 9. Access the DevWorkspace Application

Open another PowerShell window and start frontend port forwarding:

```powershell
kubectl port-forward -n developerworkspace service/frontend 4200:80
```

Keep the terminal window open.

Open the application in a browser:

http://localhost:4200

The frontend communicates with the backend through the Nginx reverse proxy configured in the frontend container.

## Optional: Local AI Integration with Ollama

DevWorkspace supports local AI functionality through Ollama. This integration is optional and is only required for features that use a local large language model.

### 1. Install Ollama

Download and install Ollama on the host machine:

https://ollama.com/download

Start Ollama and open PowerShell.

Download the recommended model:

```powershell
ollama pull llama3.2:3b
```

Verify that the model is available:

```powershell
ollama list
```

### 2. Configure Ollama Network Access

The DevWorkspace backend runs inside a Kubernetes Pod, while Ollama runs directly on the host machine.

The backend must therefore be able to communicate with the host through the following endpoint:

```text
http://host.docker.internal:11434/
```

On Windows, configure Ollama to listen on an interface accessible from Docker containers.

If necessary, set the following environment variable before starting Ollama:

```powershell
$env:OLLAMA_HOST = "0.0.0.0:11434"
```

If Ollama is already running as a background application, restart it after changing the environment variable.

**Security note:** Listening on `0.0.0.0` may expose the Ollama API to other devices on the network. Only use this configuration on trusted networks and apply appropriate firewall restrictions.

### 3. Verify Ollama Connectivity

First, verify that Ollama responds on the host machine:

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
```

Then verify that the Kubernetes backend can reach Ollama:

```powershell
kubectl exec -n developerworkspace deployment/backend -- printenv Ollama__BaseUrl
```

The expected value is:

```text
http://host.docker.internal:11434/
```

If the backend cannot reach Ollama, check the host networking configuration and firewall settings.

### 4. Test the AI Functionality

Open the DevWorkspace application:

http://localhost:4200

Navigate to an AI-supported feature and test whether the configured local model responds correctly.

### Additional Notes

- Ollama runs independently of the Kubernetes cluster.
- The language model is downloaded and stored locally on the host machine.
- The model is not included in the application Docker images.
- AI functionality is optional; the other application modules remain available without Ollama.
- Model performance depends on the host machine's available hardware resources.

## 10. Automatic Synchronization

Argo CD is configured with automated synchronization.

When changes are pushed to the `master` branch, Argo CD detects changes in the `k8s` directory and synchronizes the Kubernetes resources automatically.

The deployment workflow is:

1. A developer modifies Kubernetes configuration files.
2. The changes are committed and pushed to GitHub.
3. Argo CD detects the new repository revision.
4. Argo CD compares the desired state with the current Kubernetes state.
5. Argo CD automatically applies the required changes.

Docker image builds and publishing are handled separately by GitHub Actions.

## 11. Stopping the Local Environment

To stop the local development environment:

1. Press `Ctrl + C` in each PowerShell window running a `kubectl port-forward` command.
2. Stop Kubernetes through Docker Desktop if the environment is no longer needed.

Stopping Docker Desktop or Kubernetes does not intentionally delete the Kubernetes PersistentVolumeClaim or its stored data.

Do not delete the `developerworkspace` namespace or MongoDB PersistentVolumeClaim if the database data must be preserved.

## 12. Important Notes

- This deployment guide uses a local Kubernetes cluster provided by Docker Desktop.
- The MongoDB database is initially empty on a new installation.
- Existing database contents from another computer are not transferred automatically.
- The MongoDB PersistentVolumeClaim protects data against ordinary Pod replacement, but it is not a substitute for an independent backup.
- The Docker images are pulled from the public GitHub Container Registry.
- AI-related functionality may require a separately running Ollama instance and an appropriate model configuration.
- The local deployment is intended for development and demonstration purposes, not production hosting.