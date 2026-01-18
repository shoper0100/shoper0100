# VPS Infrastructure Deployment Guide

## 🏗️ Architecture Overview

```
VPS: 86.107.77.113
├─ BSC Node (Port 8545, 8546)      - Private RPC
├─ Graph Node Stack
│  ├─ PostgreSQL (Port 5432)        - Subgraph data
│  ├─ IPFS (Port 5001, 4001)        - Distributed storage
│  └─ Graph Node (Port 8000, 8020)  - GraphQL API
└─ Frontend Stack
   ├─ Next.js (Port 3000)           - Web application
   └─ Nginx (Port 80, 443)          - Reverse proxy
```

## 📋 Prerequisites

### VPS Requirements
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 8+ vCPU
- **RAM**: 32GB minimum
- **Storage**: 1TB SSD
- **IP**: 86.107.77.113

### Local Requirements
- SSH client
- SCP/rsync for file transfer
- Git bash (Windows) or Terminal (Linux/Mac)

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)

**Windows (PowerShell):**
```powershell
.\deploy-to-vps.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

### Option 2: Manual Deployment

#### Step 1: Configure Environment

Edit `docker/.env` with your settings:
```bash
POSTGRES_PASSWORD=your-secure-password
CONTRACT_ADDRESS=0xd4894bfF2096Ad0bB4D2815d57b5C21E2E16db44
```

#### Step 2: Copy Files to VPS

```bash
# Create directories on VPS
ssh root@86.107.77.113 "mkdir -p /opt/ridebnb/{bsc-node,graph-node,frontend,nginx}"

# Copy all configurations
scp -r docker/bsc-node/* root@86.107.77.113:/opt/ridebnb/bsc-node/
scp -r docker/graph-node/* root@86.107.77.113:/opt/ridebnb/graph-node/
scp -r docker/frontend/* root@86.107.77.113:/opt/ridebnb/frontend/
scp -r webapp root@86.107.77.113:/opt/ridebnb/
scp -r nginx root@86.107.77.113:/opt/ridebnb/
scp -r subgraph root@86.107.77.113:/opt/ridebnb/
```

#### Step 3: Deploy Components

**SSH into VPS:**
```bash
ssh root@86.107.77.113
```

**Install Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

**Start BSC Node:**
```bash
cd /opt/ridebnb/bsc-node
docker-compose up -d

# Monitor sync progress
docker logs -f ridebnb-bsc-node
```

**Wait for BSC sync** (6-12 hours for snapshot sync)

Check sync status:
```bash
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}'
```

**Start Graph Node:**
```bash
cd /opt/ridebnb/graph-node
docker-compose up -d

# Check logs
docker logs -f ridebnb-graph-node
```

**Deploy Subgraph:**
```bash
# Install Graph CLI
npm install -g @graphprotocol/graph-cli

cd /opt/ridebnb/subgraph

# Generate code
graph codegen

# Build
graph build

# Create subgraph
graph create --node http://localhost:8020/ ridebnb

# Deploy
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 ridebnb
```

**Start Frontend:**
```bash
cd /opt/ridebnb/frontend
docker-compose up -d

# Check status
docker logs -f ridebnb-frontend
```

## 🔍 Verification

### Check All Services
```bash
docker ps
```

You should see:
- `ridebnb-bsc-node`
- `ridebnb-postgres`
- `ridebnb-ipfs`
- `ridebnb-graph-node`
- `ridebnb-frontend`
- `ridebnb-nginx`

### Test Endpoints

**BSC RPC:**
```bash
curl http://86.107.77.113:8545 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Graph Node:**
```bash
curl http://86.107.77.113:8000/subgraphs/name/ridebnb \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"query":"{ _meta { block { number } } }"}'
```

**Frontend:**
```bash
curl http://86.107.77.113
```

## 📊 Management Commands

### View Logs
```bash
# BSC Node
docker logs -f ridebnb-bsc-node

# Graph Node
docker logs -f ridebnb-graph-node

# Frontend
docker logs -f ridebnb-frontend

# All logs
docker-compose logs -f
```

### Restart Services
```bash
# Restart BSC node
cd /opt/ridebnb/bsc-node && docker-compose restart

# Restart Graph Node
cd /opt/ridebnb/graph-node && docker-compose restart

# Restart Frontend
cd /opt/ridebnb/frontend && docker-compose restart
```

### Stop Services
```bash
# Stop all in component
cd /opt/ridebnb/[component-name]
docker-compose down

# Stop specific container
docker stop ridebnb-[service-name]
```

### Update Deployment
```bash
# Pull latest code
cd /opt/ridebnb
git pull

# Rebuild frontend
cd /opt/ridebnb/frontend
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🔒 Security Checklist

- [ ] Change PostgreSQL password in `.env`
- [ ] Configure firewall rules
- [ ] Set up SSL certificates for HTTPS
- [ ] Enable fail2ban for SSH protection
- [ ] Regular backups of PostgreSQL data
- [ ] Monitor disk space (BSC node grows continuously)

## 🐛 Troubleshooting

### BSC Node Not Syncing
```bash
# Check peers
docker exec ridebnb-bsc-node geth attach --exec "admin.peers.length"

# Check sync status
docker exec ridebnb-bsc-node geth attach --exec "eth.syncing"
```

### Graph Node Not Indexing
```bash
# Check Graph Node status
curl http://localhost:8030/graphql -X POST \
  -H "Content-Type: application/json" \
  --data '{"query":"{ indexingStatuses { subgraph synced health } }"}'
```

### Frontend Build Errors
```bash
# Check Node.js version
docker exec ridebnb-frontend node --version

# Rebuild
cd /opt/ridebnb/frontend
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📈 Performance Optimization

### BSC Node
- Increase `--cache` if you have more RAM
- Use `--syncmode=snap` for faster sync
- Enable pruning: `--gcmode=archive` (only if needed)

### PostgreSQL
- Tune shared_buffers (25% of RAM)
- Increase max_connections if needed
- Regular VACUUM operations

### Nginx
- Enable caching for static assets
- Configure gzip compression
- Set up CDN for frontend assets

## 🔗 Useful Links

- BSC Node Docs: https://docs.bnbchain.org/docs/rpc
- Graph Node Docs: https://thegraph.com/docs/en/hosted-service/deploy-subgraph-hosted/
- Docker Compose Reference: https://docs.docker.com/compose/

## 📞 Support

For issues, check:
1. Docker logs: `docker logs [container-name]`
2. System resources: `htop` or `docker stats`
3. Network connectivity: `netstat -tulpn`
