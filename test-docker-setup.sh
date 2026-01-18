#!/bin/bash

# Test script - verify Docker setup locally before VPS deployment

set -e

echo "🧪 Testing Docker Setup Locally"
echo "==============================="
echo ""

# Check Docker
echo "1. Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed"
    exit 1
fi
echo "✅ Docker: $(docker --version)"

# Check Docker Compose
echo ""
echo "2. Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not installed"
    exit 1
fi
echo "✅ Docker Compose: $(docker-compose --version)"

# Test BSC Node config
echo ""
echo "3. Testing BSC Node configuration..."
cd docker/bsc-node
if docker-compose config > /dev/null 2>&1; then
    echo "✅ BSC Node config valid"
else
    echo "❌ BSC Node config has errors"
    exit 1
fi
cd ../..

# Test Graph Node config
echo ""
echo "4. Testing Graph Node configuration..."
cd docker/graph-node
if docker-compose config > /dev/null 2>&1; then
    echo "✅ Graph Node config valid"
else
    echo "❌ Graph Node config has errors"
    exit 1
fi
cd ../..

# Test Frontend config
echo ""
echo "5. Testing Frontend configuration..."
cd docker/frontend
if docker-compose config > /dev/null 2>&1; then
    echo "✅ Frontend config valid"
else
    echo "❌ Frontend config has errors"
    exit 1
fi
cd ../..

# Check environment file
echo ""
echo "6. Checking environment file..."
if [ -f "docker/.env" ]; then
    echo "✅ .env file exists"
    
    # Check required vars
    source docker/.env
    if [ -z "$POSTGRES_PASSWORD" ]; then
        echo "⚠️  Warning: POSTGRES_PASSWORD not set"
    fi
    if [ -z "$CONTRACT_ADDRESS" ]; then
        echo "⚠️  Warning: CONTRACT_ADDRESS not set"
    fi
else
    echo "⚠️  Warning: docker/.env not found (will use defaults)"
fi

# Check webapp Dockerfile
echo ""
echo "7. Checking webapp Dockerfile..."
if [ -f "webapp/Dockerfile" ]; then
    echo "✅ Dockerfile exists"
else
    echo "❌ webapp/Dockerfile missing"
    exit 1
fi

# Check Nginx config
echo ""
echo "8. Checking Nginx configuration..."
if [ -f "nginx/nginx.conf" ]; then
    echo "✅ Nginx config exists"
else
    echo "❌ nginx/nginx.conf missing"
    exit 1
fi

# Test build frontend image (optional, takes time)
echo ""
echo "9. Test build frontend image? (y/n)"
read -r response
if [ "$response" = "y" ]; then
    echo "Building frontend image..."
    cd webapp
    if docker build -t ridebnb-test . > /dev/null 2>&1; then
        echo "✅ Frontend builds successfully"
        docker rmi ridebnb-test
    else
        echo "❌ Frontend build failed"
        exit 1
    fi
    cd ..
fi

echo ""
echo "==============================="
echo "✅ All tests passed!"
echo "==============================="
echo ""
echo "Next steps:"
echo "1. Review docker/.env configuration"
echo "2. Run deployment: ./deploy-to-vps.sh"
echo ""
