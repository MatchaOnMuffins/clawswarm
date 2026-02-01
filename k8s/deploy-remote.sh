#!/bin/bash

set -e

# Configuration - UPDATE THESE!
REGISTRY="your-registry.io"  # e.g., docker.io/username or ghcr.io/username
IMAGE_PREFIX="${REGISTRY}/clawswarm"

echo "ClawSwarm Remote Kubernetes Deployment Script"
echo "=============================================="
echo ""
echo "Using registry: ${REGISTRY}"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed or not in PATH"
    exit 1
fi

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "Error: docker is not installed or not in PATH"
    exit 1
fi

# Build and push Docker images
echo "Building and pushing Docker images..."
echo ""

echo "Building backend image..."
cd ../backend
docker build -t ${IMAGE_PREFIX}-backend:latest .
docker push ${IMAGE_PREFIX}-backend:latest
echo "Backend image pushed successfully"
echo ""

echo "Building frontend image..."
cd ../frontend
docker build -t ${IMAGE_PREFIX}-frontend:latest .
docker push ${IMAGE_PREFIX}-frontend:latest
echo "Frontend image pushed successfully"
echo ""

# Return to k8s directory
cd ../k8s

# Update deployment manifests with correct image names
echo "Updating deployment manifests..."
sed -i.bak "s|image: clawswarm-backend:latest|image: ${IMAGE_PREFIX}-backend:latest|g" backend-deployment.yaml
sed -i.bak "s|image: clawswarm-frontend:latest|image: ${IMAGE_PREFIX}-frontend:latest|g" frontend-deployment.yaml
sed -i.bak "s|imagePullPolicy: IfNotPresent|imagePullPolicy: Always|g" backend-deployment.yaml
sed -i.bak "s|imagePullPolicy: IfNotPresent|imagePullPolicy: Always|g" frontend-deployment.yaml
echo ""

# Create namespace
echo "Creating namespace..."
kubectl apply -f namespace.yaml
echo ""

# Check if secret exists, if not prompt user
if kubectl get secret clawswarm-secrets -n clawswarm &> /dev/null; then
    echo "Secret 'clawswarm-secrets' already exists in namespace 'clawswarm'"
else
    echo "Warning: Secret 'clawswarm-secrets' does not exist!"
    echo "Please create it using the secret.yaml.example template:"
    echo "  1. Copy secret.yaml.example to secret.yaml"
    echo "  2. Update the database-url with your actual credentials"
    echo "  3. Run: kubectl apply -f secret.yaml"
    echo ""
    read -p "Press Enter to continue (or Ctrl+C to abort)..."
fi

# Apply services
echo "Creating services..."
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-service.yaml
echo ""

# Apply deployments
echo "Creating deployments..."
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
echo ""

# Apply ingress
echo "Creating ingress..."
kubectl apply -f ingress.yaml
echo ""

# Restore backup files
mv backend-deployment.yaml.bak backend-deployment.yaml
mv frontend-deployment.yaml.bak frontend-deployment.yaml

echo "Deployment complete!"
echo ""
echo "Check deployment status with:"
echo "  kubectl get pods -n clawswarm"
echo "  kubectl get services -n clawswarm"
echo "  kubectl get ingress -n clawswarm"
echo ""
echo "Your application should be available at: https://clawswarm.matchaonmuffins.dev"
