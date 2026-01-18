# Quick Start Guide - VPS Deployment

## 🚀 Fastest Path to Production

### Prerequisites Check
```bash
# From your local machine
ssh root@86.107.77.113 "echo 'SSH OK'"
```

### 1. Configure Environment (2 minutes)

Edit `docker/.env`:
```bash
POSTGRES_PASSWORD=ChangeMe123!
CONTRACT_ADDRESS=0xd4894bfF2096Ad0bB4D2815d57b5C21E2E16db44
DEFAULT_REFER=36999
```

### 2. Deploy Everything (1 command)

**Windows:**
```powershell
.\deploy-to-vps.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy-to-vps.sh health-check.sh backup.sh
./deploy-to-vps.sh
```

### 3. Wait for BSC Sync (6-12 hours)

Monitor progress:
```bash
ssh root@86.107.77.113 'docker logs -f ridebnb-bsc-node'
```

Check sync status:
```bash
curl http://86.107.77.113:8545 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}'

# When synced, returns: {"jsonrpc":"2.0","id":1,"result":false}
```

### 4. Deploy Subgraph

```bash
ssh root@86.107.77.113
cd /opt/ridebnb/docker/graph-node
chmod +x deploy-subgraph.sh
./deploy-subgraph.sh
```

### 5. Access Your App

- **Frontend**: http://86.107.77.113
- **Graph API**: http://86.107.77.113:8000/subgraphs/name/ridebnb
- **RPC**: http://86.107.77.113:8545

### 6. Health Check

```bash
./health-check.sh
```

## ⚡ Component Control

### Start/Stop Individual Components

```bash
ssh root@86.107.77.113

# BSC Node
cd /opt/ridebnb/bsc-node
docker-compose up -d        # Start
docker-compose down         # Stop
docker-compose restart      # Restart

# Graph Node Stack
cd /opt/ridebnb/graph-node
docker-compose up -d
docker-compose down
docker-compose restart

# Frontend
cd /opt/ridebnb/frontend
docker-compose up -d
docker-compose down
docker-compose restart
```

### View Logs

```bash
# All logs
docker logs -f ridebnb-bsc-node
docker logs -f ridebnb-graph-node
docker logs -f ridebnb-postgres
docker logs -f ridebnb-ipfs
docker logs -f ridebnb-frontend
docker logs -f ridebnb-nginx

# Follow all
docker logs -f $(docker ps -q)
```

## 🔧 Common Tasks

### Update Frontend

```bash
# Local machine - build new image
cd f:\ridebnb\docker\frontend
docker build -t ridebnb-frontend:latest ../../webapp

# Save image
docker save ridebnb-frontend:latest | gzip > frontend.tar.gz

# Copy to VPS
scp frontend.tar.gz root@86.107.77.113:/tmp/

# VPS - load and restart
ssh root@86.107.77.113
docker load < /tmp/frontend.tar.gz
cd /opt/ridebnb/frontend
docker-compose up -d --force-recreate
```

### Update Subgraph

```bash
# After modifying schema.graphql or mapping.ts
ssh root@86.107.77.113
cd /opt/ridebnb/subgraph
graph codegen
graph build
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 ridebnb
```

### Check Resources

```bash
ssh root@86.107.77.113

# Disk usage
df -h
docker system df

# Memory
free -h

# Container stats
docker stats

# Clean up unused data
docker system prune -a
```

## 🛡️ Security Setup

### 1. Change PostgreSQL Password

```bash
vim /opt/ridebnb/docker/.env
# Update POSTGRES_PASSWORD

cd /opt/ridebnb/graph-node
docker-compose down
docker-compose up -d
```

### 2. Setup Firewall

```bash
apt-get install -y ufw
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw --force enable
```

### 3. Setup SSL (Optional but Recommended)

See [SSL_SETUP.md](./SSL_SETUP.md) for detailed instructions.

Quick option with Cloudflare (easiest):
1. Add domain to Cloudflare
2. Point A record to 86.107.77.113
3. Enable SSL (Full mode)
4. Done! Cloudflare handles SSL

## 📊 Monitoring

### Setup Auto-Backup

```bash
ssh root@86.107.77.113

# Copy backup script
cp /opt/ridebnb/backup.sh /usr/local/bin/
chmod +x /usr/local/bin/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup.sh
```

### Setup Health Monitoring

```bash
# Install monitoring script
cp health-check.sh /usr/local/bin/
chmod +x /usr/local/bin/health-check.sh

# Run every hour
crontab -e
# Add: 0 * * * * /usr/local/bin/health-check.sh >> /var/log/ridebnb-health.log
```

## 🗺️ Architecture Diagram

```
Internet
    │
    ├── Port 80/443 (HTTP/HTTPS)
    │   └── Nginx (reverse proxy)
    │       ├── / → Next.js Frontend (Port 3000)
    │       ├── /subgraphs → Graph Node (Port 8000)
    │       └── /rpc → BSC Node (Port 8545)
    │
    ├── BSC RPC Node (Geth)
    │   ├── HTTP RPC: 8545
    │   ├── WebSocket: 8546
    │   └── Data: /var/lib/docker/volumes/bsc-data
    │
    └── Graph Node Stack
        ├── Graph Node (Port 8000, 8020)
        ├── PostgreSQL (Port 5432)
        │   └── Data: /var/lib/docker/volumes/postgres-data
        └── IPFS (Port 5001, 4001)
            └── Data: /var/lib/docker/volumes/ipfs-data
```

## 📞 Troubleshooting

### BSC Node Won't Sync

```bash
# Check peers
docker exec ridebnb-bsc-node geth attach \
  --exec "admin.peers.length" http://localhost:8545

# Should be > 0. If 0, restart:
cd /opt/ridebnb/bsc-node
docker-compose restart
```

### Graph Node Can't Connect to RPC

```bash
# Check if BSC node is accessible from Graph Node
docker exec ridebnb-graph-node \
  wget -qO- http://bsc-node:8545

# Should return RPC response
```

### Frontend Won't Build

```bash
# Check Node version
docker run --rm node:20-alpine node --version

# Rebuild from scratch
cd /opt/ridebnb/frontend
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Out of Disk Space

```bash
# Check what's using space
docker system df
du -sh /var/lib/docker/volumes/*

# Clean up
docker system prune -a
docker volume prune
```

## 📚 Documentation Reference

- [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) - Full deployment guide
- [SSL_SETUP.md](./SSL_SETUP.md) - SSL/HTTPS configuration
- [subgraph/DEPLOYMENT.md](./subgraph/DEPLOYMENT.md) - Subgraph deployment
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Smart contract deployment

## 🎯 Success Checklist

- [ ] All containers running (`docker ps`)
- [ ] BSC node synced (check with health-check.sh)
- [ ] Graph Node indexing subgraph
- [ ] Frontend accessible at http://86.107.77.113
- [ ] RPC responding to requests
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] SSL configured (optional)
- [ ] Monitoring setup
