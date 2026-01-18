# Quick Manual Deployment Steps

You're currently on VPS. Follow these steps:

## 1. Create Deployment Directory (On VPS)
```bash
mkdir -p /opt/ridebnb/{docker/bsc-node,docker/graph-node,docker/frontend,nginx,webapp,subgraph}
```

## 2. Exit VPS
```bash
exit
```

## 3. Copy Files from Local Machine
```powershell
# Copy Docker configurations
scp -r docker/bsc-node ridebnb-vps:/opt/ridebnb/docker/
scp -r docker/graph-node ridebnb-vps:/opt/ridebnb/docker/
scp -r docker/frontend ridebnb-vps:/opt/ridebnb/docker/
scp docker/.env ridebnb-vps:/opt/ridebnb/docker/

# Copy application files
scp -r webapp ridebnb-vps:/opt/ridebnb/
scp -r nginx ridebnb-vps:/opt/ridebnb/
scp -r subgraph ridebnb-vps:/opt/ridebnb/
```

## 4. SSH Back and Start Services
```bash
ssh ridebnb-vps

# Start BSC Node
cd /opt/ridebnb/docker/bsc-node
docker-compose up -d

# Monitor sync
docker logs -f ridebnb-bsc-node
```

Press `Ctrl+C` to exit logs when done monitoring.

## 5. After BSC Syncs (6-12 hours)

```bash
# Start Graph Node
cd /opt/ridebnb/docker/graph-node
docker-compose up -d

# Deploy Subgraph
./deploy-subgraph.sh

# Start Frontend
cd /opt/ridebnb/docker/frontend
docker-compose up -d
```

## 6. Verify Deployment

```bash
# Check all containers
docker ps

# Check frontend
curl http://localhost
```

Your app will be live at: **http://86.107.77.113**
