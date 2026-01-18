#!/bin/bash

# RideBNB VPS Deployment Script
# This script deploys all components to VPS: 86.107.77.113

set -e

VPS_IP="86.107.77.113"
VPS_USER="root"
DEPLOY_DIR="/opt/ridebnb"

echo "🚀 Starting RideBNB VPS Deployment"
echo "=================================="
echo "VPS IP: $VPS_IP"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Check SSH connection
echo "📡 Step 1: Testing SSH connection..."
if ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo 'Connection successful'" &> /dev/null; then
    print_status "SSH connection successful"
else
    echo "❌ SSH connection failed. Please ensure:"
    echo "   1. SSH is enabled on VPS"
    echo "   2. You have SSH key access or password"
    echo "   3. Firewall allows SSH (port 22)"
    exit 1
fi

# Step 2: Install Docker on VPS
echo ""
echo "🐳 Step 2: Installing Docker and Docker Compose..."
ssh $VPS_USER@$VPS_IP << 'EOF'
    # Update system
    apt-get update
    
    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
    fi
    
    # Install Docker Compose if not present
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    echo "Docker version: $(docker --version)"
    echo "Docker Compose version: $(docker-compose --version)"
EOF
print_status "Docker installed"

# Step 3: Create deployment directory
echo ""
echo "📁 Step 3: Creating deployment directory..."
ssh $VPS_USER@$VPS_IP "mkdir -p $DEPLOY_DIR/{bsc-node,graph-node,frontend,nginx}"
print_status "Deployment directory created"

# Step 4: Copy files to VPS
echo ""
echo "📤 Step 4: Copying files to VPS..."

# Copy BSC node config
echo "  → Copying BSC node configuration..."
scp -r docker/bsc-node/* $VPS_USER@$VPS_IP:$DEPLOY_DIR/bsc-node/

# Copy Graph Node config
echo "  → Copying Graph Node configuration..."
scp -r docker/graph-node/* $VPS_USER@$VPS_IP:$DEPLOY_DIR/graph-node/

# Copy Frontend config
echo "  → Copying frontend configuration..."
scp -r docker/frontend/* $VPS_USER@$VPS_IP:$DEPLOY_DIR/frontend/
scp -r webapp $VPS_USER@$VPS_IP:$DEPLOY_DIR/

# Copy Nginx config
echo "  → Copying Nginx configuration..."
scp -r nginx/* $VPS_USER@$VPS_IP:$DEPLOY_DIR/nginx/

# Copy environment file
echo "  → Copying environment configuration..."
scp docker/.env $VPS_USER@$VPS_IP:$DEPLOY_DIR/.env

# Copy subgraph
echo "  → Copying subgraph..."
scp -r subgraph $VPS_USER@$VPS_IP:$DEPLOY_DIR/

print_status "Files copied to VPS"

# Step 5: Start BSC Node
echo ""
echo "⛓️  Step 5: Starting BSC Node (this will take time to sync)..."
ssh $VPS_USER@$VPS_IP << EOF
    cd $DEPLOY_DIR/bsc-node
    docker-compose up -d
    echo "BSC Node starting... Check logs with: docker logs -f ridebnb-bsc-node"
EOF
print_status "BSC Node started"
print_warning "BSC Node sync will take 6-12 hours with snapshot sync"

# Step 6: Wait for user confirmation
echo ""
echo "⏸️  IMPORTANT: Wait for BSC node to sync before continuing"
echo "   Check sync status: ssh $VPS_USER@$VPS_IP 'docker logs ridebnb-bsc-node'"
echo "   Or test RPC: curl http://$VPS_IP:8545 -X POST -H 'Content-Type: application/json' --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo ""
read -p "Press Enter when BSC node is synced and ready..."

# Step 7: Start Graph Node stack
echo ""
echo "📊 Step 7: Starting Graph Node stack..."
ssh $VPS_USER@$VPS_IP << EOF
    cd $DEPLOY_DIR/graph-node
    docker-compose up -d
    echo "Graph Node stack starting..."
EOF
print_status "Graph Node stack started"

# Step 8: Deploy subgraph
echo ""
echo "🗂️  Step 8: Deploying subgraph..."
print_warning "Subgraph deployment must be done manually. Follow these steps:"
echo ""
echo "1. SSH into VPS: ssh $VPS_USER@$VPS_IP"
echo "2. Install Graph CLI: npm install -g @graphprotocol/graph-cli"
echo "3. Go to subgraph dir: cd $DEPLOY_DIR/subgraph"
echo "4. Generate code: graph codegen"
echo "5. Build subgraph: graph build"
echo "6. Create subgraph: graph create --node http://localhost:8020/ ridebnb"
echo "7. Deploy subgraph: graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 ridebnb"
echo ""
read -p "Press Enter when subgraph is deployed..."

# Step 9: Start Frontend
echo ""
echo "🎨 Step 9: Starting Frontend..."
ssh $VPS_USER@$VPS_IP << EOF
    cd $DEPLOY_DIR/frontend
    docker-compose up -d
    echo "Frontend starting..."
EOF
print_status "Frontend started"

# Step 10: Summary
echo ""
echo "=================================="
echo "🎉 Deployment Complete!"
echo "=================================="
echo ""
echo "📍 Access Points:"
echo "   Frontend:        http://$VPS_IP"
echo "   Graph Node:      http://$VPS_IP:8000"
echo "   BSC RPC:         http://$VPS_IP:8545"
echo "   PostgreSQL:      $VPS_IP:5432"
echo ""
echo "🔧 Management Commands:"
echo "   View all containers:     ssh $VPS_USER@$VPS_IP 'docker ps'"
echo "   View BSC logs:           ssh $VPS_USER@$VPS_IP 'docker logs -f ridebnb-bsc-node'"
echo "   View Graph Node logs:    ssh $VPS_USER@$VPS_IP 'docker logs -f ridebnb-graph-node'"
echo "   View Frontend logs:      ssh $VPS_USER@$VPS_IP 'docker logs -f ridebnb-frontend'"
echo ""
echo "📊 Check Status:"
echo "   BSC Node block:          curl http://$VPS_IP:8545 -X POST -H 'Content-Type: application/json' --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo "   Graph Node health:       curl http://$VPS_IP:8030/graphql"
echo ""
