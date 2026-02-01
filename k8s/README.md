# ClawSwarm Kubernetes Deployment

This directory contains all the Kubernetes manifests and deployment scripts for deploying ClawSwarm to your Kubernetes cluster.

## Prerequisites

- `kubectl` installed and configured to access your cluster
- Docker installed for building images
- A PostgreSQL database accessible from your cluster
- Cloudflare Tunnel ingress controller configured in your cluster

## Architecture

The deployment consists of:

- **Backend**: Node.js/Express API server running on port 3001
- **Frontend**: React application served by nginx on port 80
- **Database**: PostgreSQL (external, configured via secret)
- **Ingress**: Cloudflare Tunnel routing traffic to clawswarm.matchaonmuffins.dev

## Quick Start

### 1. Configure Database Secret

First, create your database secret:

```bash
# Copy the example secret
cp secret.yaml.example secret.yaml

# Edit with your actual database URL
# Example: postgresql://user:password@postgres-host:5432/clawswarm?schema=public
nano secret.yaml

# Apply the secret
kubectl apply -f secret.yaml
```

### 2. Deploy Using the Script

The easiest way to deploy is using the provided script:

```bash
./deploy.sh
```

This script will:
1. Build the Docker images for backend and frontend
2. Load images into the cluster (if using kind)
3. Create the namespace
4. Deploy all services, deployments, and ingress

### 3. Manual Deployment

If you prefer to deploy manually:

```bash
# Build images
cd ../backend
docker build -t clawswarm-backend:latest .

cd ../frontend
docker build -t clawswarm-frontend:latest .

# If using kind, load images
kind load docker-image clawswarm-backend:latest
kind load docker-image clawswarm-frontend:latest

# Apply manifests
cd ../k8s
kubectl apply -f namespace.yaml
kubectl apply -f secret.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-service.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml
```

## Verify Deployment

Check that all resources are running:

```bash
# Check pods
kubectl get pods -n clawswarm

# Check services
kubectl get services -n clawswarm

# Check ingress
kubectl get ingress -n clawswarm

# View logs
kubectl logs -n clawswarm -l component=backend
kubectl logs -n clawswarm -l component=frontend
```

## Access the Application

Once deployed, the application will be available at:

**https://clawswarm.matchaonmuffins.dev**

### API Routes

- `/api/v1/agents` - Agent management
- `/api/v1/problems` - Problem management
- `/api/v1/tasks` - Task assignment
- `/api/v1/solutions` - Solution submission
- `/api/v1/aggregations` - Solution aggregation
- `/health` - Health check endpoint

### Frontend Routes

- `/` - Dashboard
- `/solutions` - Solutions view
- `/aggregations` - Aggregations view

## File Structure

```
k8s/
├── namespace.yaml              # Namespace definition
├── backend-deployment.yaml     # Backend deployment
├── frontend-deployment.yaml    # Frontend deployment
├── backend-service.yaml        # Backend service
├── frontend-service.yaml       # Frontend service
├── ingress.yaml               # Ingress configuration
├── secret.yaml.example        # Secret template
├── deploy.sh                  # Automated deployment script
└── README.md                  # This file
```

## Troubleshooting

### Pods not starting

Check pod status and logs:
```bash
kubectl describe pod -n clawswarm <pod-name>
kubectl logs -n clawswarm <pod-name>
```

### Database connection issues

Verify the secret is correct:
```bash
kubectl get secret clawswarm-secrets -n clawswarm -o yaml
```

### Ingress not working

Check ingress status:
```bash
kubectl describe ingress clawswarm -n clawswarm
```

Verify the cloudflare-tunnel ingress controller is running:
```bash
kubectl get ingressclass
```

### Image pull errors

If using a local cluster like kind, make sure to load the images:
```bash
kind load docker-image clawswarm-backend:latest
kind load docker-image clawswarm-frontend:latest
```

## Updating the Deployment

To update after making changes:

```bash
# Rebuild images
cd ../backend
docker build -t clawswarm-backend:latest .

cd ../frontend
docker build -t clawswarm-frontend:latest .

# If using kind
kind load docker-image clawswarm-backend:latest
kind load docker-image clawswarm-frontend:latest

# Restart deployments
kubectl rollout restart deployment/backend -n clawswarm
kubectl rollout restart deployment/frontend -n clawswarm
```

## Cleaning Up

To remove the deployment:

```bash
kubectl delete namespace clawswarm
```

## Configuration

### Scaling

To scale the deployments:

```bash
kubectl scale deployment/backend -n clawswarm --replicas=3
kubectl scale deployment/frontend -n clawswarm --replicas=3
```

### Environment Variables

Backend environment variables are configured in `backend-deployment.yaml`:
- `PORT`: Server port (default: 3001)
- `DATABASE_URL`: PostgreSQL connection string (from secret)

## Support

For issues or questions, refer to the main ClawSwarm repository documentation.
