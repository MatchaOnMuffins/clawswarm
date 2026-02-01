#!/bin/bash

set -e

echo "ClawSwarm Kubernetes Deployment Script"
echo "======================================="
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

# Build Docker images
echo "Building Docker images..."
echo ""

echo "Building backend image..."
cd ../backend
docker build -t clawswarm-backend:latest .
echo "Backend image built successfully"
echo ""

echo "Building frontend image..."
cd ../frontend
docker build -t clawswarm-frontend:latest .
echo "Frontend image built successfully"
echo ""

# Load images into kind cluster if using kind
if kubectl config current-context | grep -q "kind"; then
    echo "Detected kind cluster, loading images..."
    kind load docker-image clawswarm-backend:latest
    kind load docker-image clawswarm-frontend:latest
    echo "Images loaded into kind cluster"
    echo ""
fi

# Return to k8s directory
cd ../k8s

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

echo "Deployment complete!"
echo ""
echo "Check deployment status with:"
echo "  kubectl get pods -n clawswarm"
echo "  kubectl get services -n clawswarm"
echo "  kubectl get ingress -n clawswarm"
echo ""
echo "Your application should be available at: https://clawswarm.matchaonmuffins.dev"
