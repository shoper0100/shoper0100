# RideBNB VPS Deployment - PowerShell Script
# Deploy to VPS: 86.107.77.113

$VPS_IP = "86.107.77.113"
$VPS_USER = "root"
$DEPLOY_DIR = "/opt/ridebnb"

Write-Host "🚀 Starting RideBNB VPS Deployment" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "VPS IP: $VPS_IP"
Write-Host ""

# Step 1: Test SSH connection
Write-Host "📡 Step 1: Testing SSH connection..." -ForegroundColor Yellow
$testSSH = ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo 'OK'" 2>$null
if ($testSSH -eq "OK") {
    Write-Host "✓ SSH connection successful" -ForegroundColor Green
} else {
    Write-Host "❌ SSH connection failed" -ForegroundColor Red
    Write-Host "Please ensure SSH access is configured"
    exit 1
}

# Step 2: Install Docker on VPS
Write-Host ""
Write-Host "🐳 Step 2: Installing Docker and Docker Compose..." -ForegroundColor Yellow
ssh $VPS_USER@$VPS_IP @"
    apt-get update -qq
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
    fi
    if ! command -v docker-compose &> /dev/null; then
        curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-Linux-x86_64' -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    docker --version
    docker-compose --version
"@
Write-Host "✓ Docker installed" -ForegroundColor Green

# Step 3: Create directories
Write-Host ""
Write-Host "📁 Step 3: Creating deployment directories..." -ForegroundColor Yellow
ssh $VPS_USER@$VPS_IP "mkdir -p $DEPLOY_DIR/{bsc-node,graph-node,frontend,nginx,subgraph,webapp}"
Write-Host "✓ Directories created" -ForegroundColor Green

# Step 4: Copy files
Write-Host ""
Write-Host "📤 Step 4: Copying files to VPS..." -ForegroundColor Yellow

Write-Host "  → BSC node configuration..."
scp -r docker/bsc-node/* ${VPS_USER}@${VPS_IP}:${DEPLOY_DIR}/bsc-node/

Write-Host "  → Graph Node configuration..."
scp -r docker/graph-node/* ${VPS_USER}@${VPS_IP}:${DEPLOY_DIR}/graph-node/

Write-Host "  → Frontend configuration..."
scp -r docker/frontend/* ${VPS_USER}@${VPS_IP}:${DEPLOY_DIR}/frontend/

Write-Host "  → Webapp files..."
scp -r webapp/* ${VPS_USER}@${VPS_IP}:${DEPLOY_DIR}/webapp/

Write-Host "  → Nginx configuration..."
scp -r nginx/* ${VPS_USER}@${VPS_IP}:${DEPLOY_DIR}/nginx/

Write-Host "  → Subgraph files..."
scp -r subgraph/* ${VPS_USER}@${VPS_IP}:${DEPLOY_DIR}/subgraph/

Write-Host "  → Environment file..."
scp docker/.env ${VPS_USER}@${VPS_IP}:${DEPLOY_DIR}/.env

Write-Host "✓ Files copied" -ForegroundColor Green

# Step 5: Start services
Write-Host ""
Write-Host "⛓️  Step 5: Starting BSC Node..." -ForegroundColor Yellow
ssh $VPS_USER@$VPS_IP "cd $DEPLOY_DIR/bsc-node && docker-compose up -d"
Write-Host "✓ BSC Node started (syncing...)" -ForegroundColor Green

Write-Host ""
Write-Host "⚠️  IMPORTANT: BSC node will take 6-12 hours to sync" -ForegroundColor Yellow
Write-Host "   Monitor: ssh $VPS_USER@$VPS_IP 'docker logs -f ridebnb-bsc-node'"
Write-Host ""
$continue = Read-Host "Continue with Graph Node deployment? (y/n)"

if ($continue -eq 'y') {
    Write-Host ""
    Write-Host "📊 Step 6: Starting Graph Node stack..." -ForegroundColor Yellow
    ssh $VPS_USER@$VPS_IP "cd $DEPLOY_DIR/graph-node && docker-compose up -d"
    Write-Host "✓ Graph Node started" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🎨 Step 7: Starting Frontend..." -ForegroundColor Yellow
    ssh $VPS_USER@$VPS_IP "cd $DEPLOY_DIR/frontend && docker-compose up -d"
    Write-Host "✓ Frontend started" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "🎉 Deployment Initiated!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:"
Write-Host "   Frontend:        http://$VPS_IP"
Write-Host "   Graph Node:      http://$VPS_IP:8000"
Write-Host "   BSC RPC:         http://$VPS_IP:8545"
Write-Host ""
Write-Host "📝 Next Steps:"
Write-Host "   1. Wait for BSC node sync"
Write-Host "   2. Deploy subgraph (see DEPLOYMENT.md)"
Write-Host "   3. Test frontend access"
Write-Host ""
