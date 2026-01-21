#!/bin/bash

# FiveDollarBNB - VPS Docker Deployment Script
# Usage: ./deploy.sh

set -e

# Configuration
VPS_HOST="root@86.107.77.113"
APP_NAME="fivedollarbnb"
DOCKER_IMAGE="fivedollarbnb-frontend"
VPS_DIR="/root/fivedollarbnb"

echo "🚀 Starting deployment to VPS..."
echo "================================"

# Step 1: Build Docker image
echo ""
echo "📦 Building Docker image..."
docker build -t $DOCKER_IMAGE:latest .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Step 2: Save image to tar
echo ""
echo "💾 Saving image to tar..."
docker save -o $DOCKER_IMAGE.tar $DOCKER_IMAGE:latest

# Step 3: Transfer files to VPS
echo ""
echo "📤 Transferring files to VPS..."
echo "   - Docker image"
scp $DOCKER_IMAGE.tar $VPS_HOST:/tmp/

echo "   - docker-compose.yml"
scp docker-compose.yml $VPS_HOST:$VPS_DIR/

# Step 4: Deploy on VPS
echo ""
echo "🔧 Deploying on VPS..."
ssh $VPS_HOST << 'ENDSSH'
set -e

echo "   - Loading Docker image..."
docker load -i /tmp/fivedollarbnb-frontend.tar

echo "   - Stopping old container..."
cd /root/fivedollarbnb
docker-compose down || true

echo "   - Starting new container..."
docker-compose up -d

echo "   - Cleaning up..."
rm /tmp/fivedollarbnb-frontend.tar

echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "📝 Recent logs:"
docker-compose logs --tail=20
ENDSSH

# Step 5: Clean up local files
echo ""
echo "🧹 Cleaning up local files..."
rm $DOCKER_IMAGE.tar

# Success
echo ""
echo "================================"
echo "✅ Deployment complete!"
echo ""
echo "🌐 Application URL: http://86.107.77.113:3000"
echo "📊 Check status: ssh $VPS_HOST 'cd $VPS_DIR && docker-compose ps'"
echo "📝 View logs: ssh $VPS_HOST 'cd $VPS_DIR && docker-compose logs -f'"
echo ""
