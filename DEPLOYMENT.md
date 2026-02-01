# ClawSwarm Deployment Guide

## Current Status

✅ PostgreSQL database deployed in cluster
✅ Kubernetes manifests created
✅ Namespace and secrets configured
⏳ Docker images need to be built and deployed

## What's Been Deployed So Far

The following resources are already running in your cluster:

```bash
kubectl get all -n clawswarm
```

- Namespace: `clawswarm`
- Secret: `clawswarm-secrets` (contains database credentials)
- PostgreSQL database with persistent storage (5Gi PVC)
- PostgreSQL service accessible at `postgres:5432` within the cluster

## Next Steps: Build and Deploy Application

Since Docker is not available in the current environment, you have two options:

### Option 1: Install Docker and Build Locally (Recommended)

1. **Install Docker Desktop for Mac**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop

2. **Build and push images to a registry**

   You'll need to push to a container registry. Options:
   - Docker Hub (docker.io)
   - GitHub Container Registry (ghcr.io)
   - Google Container Registry (gcr.io)
   - Any other registry you have access to

   ```bash
   # Set your registry
   export REGISTRY="docker.io/yourusername"
   # or
   export REGISTRY="ghcr.io/yourusername"

   # Login to your registry
   docker login $REGISTRY

   # Build backend
   cd /Users/matcha/Code/clawswarm/backend
   docker build -t $REGISTRY/clawswarm-backend:latest .
   docker push $REGISTRY/clawswarm-backend:latest

   # Build frontend
   cd /Users/matcha/Code/clawswarm/frontend
   docker build -t $REGISTRY/clawswarm-frontend:latest .
   docker push $REGISTRY/clawswarm-frontend:latest
   ```

3. **Update deployment manifests with your registry**

   ```bash
   cd /Users/matcha/Code/clawswarm/k8s
   
   # Update backend deployment
   sed -i '' "s|clawswarm-backend:latest|$REGISTRY/clawswarm-backend:latest|g" backend-deployment.yaml
   sed -i '' "s|imagePullPolicy: IfNotPresent|imagePullPolicy: Always|g" backend-deployment.yaml
   
   # Update frontend deployment
   sed -i '' "s|clawswarm-frontend:latest|$REGISTRY/clawswarm-frontend:latest|g" frontend-deployment.yaml
   sed -i '' "s|imagePullPolicy: IfNotPresent|imagePullPolicy: Always|g" frontend-deployment.yaml
   ```

4. **Deploy to Kubernetes**

   ```bash
   cd /Users/matcha/Code/clawswarm/k8s
   
   # Apply services
   kubectl apply -f backend-service.yaml
   kubectl apply -f frontend-service.yaml
   
   # Apply deployments
   kubectl apply -f backend-deployment.yaml
   kubectl apply -f frontend-deployment.yaml
   
   # Apply ingress
   kubectl apply -f ingress.yaml
   ```

5. **Initialize the database**

   Once the backend pod is running, initialize the database:

   ```bash
   # Get the backend pod name
   POD=$(kubectl get pod -n clawswarm -l component=backend -o jsonpath='{.items[0].metadata.name}')
   
   # Run Prisma migrations
   kubectl exec -n clawswarm $POD -- npm run db:migrate
   
   # Optional: Seed with sample data
   kubectl exec -n clawswarm $POD -- npm run db:seed
   ```

### Option 2: Use GitHub Actions for CI/CD

If you don't want to install Docker locally, you can set up GitHub Actions to build and deploy:

1. Push your code to GitHub
2. Set up GitHub Container Registry secrets
3. Use the workflow file I can create for automated builds

Would you like me to create a GitHub Actions workflow file?

## Verify Deployment

Once images are built and deployed:

```bash
# Check all resources
kubectl get all -n clawswarm

# Check pods status
kubectl get pods -n clawswarm

# Check logs
kubectl logs -n clawswarm -l component=backend
kubectl logs -n clawswarm -l component=frontend

# Check ingress
kubectl get ingress -n clawswarm
```

## Access Your Application

Once deployed, your application will be available at:

**https://clawswarm.matchaonmuffins.dev**

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod -n clawswarm <pod-name>
kubectl logs -n clawswarm <pod-name>
```

### Database connection issues

```bash
# Check PostgreSQL pod
kubectl get pod -n clawswarm -l component=postgres

# Check PostgreSQL logs
kubectl logs -n clawswarm -l component=postgres

# Test connection from backend pod
POD=$(kubectl get pod -n clawswarm -l component=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n clawswarm $POD -- sh -c 'apt-get update && apt-get install -y postgresql-client && psql $DATABASE_URL -c "SELECT 1"'
```

## Database Credentials

- **Database Name**: clawswarm
- **Username**: clawswarm
- **Password**: clawswarm123
- **Host**: postgres (within cluster)
- **Port**: 5432
- **Connection String**: `postgresql://clawswarm:clawswarm123@postgres:5432/clawswarm?schema=public`

## Clean Up

To remove the entire deployment:

```bash
kubectl delete namespace clawswarm
```

This will remove all resources including the database and persistent volume claim.
