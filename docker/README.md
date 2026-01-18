# Docker Infrastructure for RideBNB

This directory contains modular Docker Compose configurations for deploying RideBNB to your VPS.

## 📁 Structure

```
docker/
├── bsc-node/
│   └── docker-compose.yml       # BSC RPC Node (Geth)
├── graph-node/
│   ├── docker-compose.yml       # Graph Node + PostgreSQL + IPFS
│   └── deploy-subgraph.sh       # Subgraph deployment script
├── frontend/
│   └── docker-compose.yml       # Next.js + Nginx
└── .env                         # Shared environment configuration
```

## 🚀 Quick Deployment

### All Components

```bash
# Start BSC Node
cd bsc-node && docker-compose up -d

# Start Graph Node Stack (after BSC syncs)
cd ../graph-node && docker-compose up -d

# Start Frontend
cd ../frontend && docker-compose up -d
```

### Individual Components

**BSC Node Only:**
```bash
cd bsc-node
docker-compose up -d
docker logs -f ridebnb-bsc-node
```

**Graph Node Only:**
```bash
cd graph-node
docker-compose up -d
docker logs -f ridebnb-graph-node
```

**Frontend Only:**
```bash
cd frontend
docker-compose up -d
docker logs -f ridebnb-frontend
```

## ⚙️ Configuration

Edit `.env` file:

```bash
# PostgreSQL
POSTGRES_PASSWORD=your-secure-password

# BSC RPC (for Graph Node)
BSC_RPC_URL=http://86.107.77.113:8545

# Smart Contract
CONTRACT_ADDRESS=0xd4894bfF2096Ad0bB4D2815d57b5C21E2E16db44
DEFAULT_REFER=36999

# Subgraph
SUBGRAPH_URL=http://86.107.77.113:8000/subgraphs/name/ridebnb
```

## 🔄 Management

### View All Containers
```bash
docker ps | grep ridebnb
```

### Stop All
```bash
cd bsc-node && docker-compose down
cd ../graph-node && docker-compose down
cd ../frontend && docker-compose down
```

### Restart Specific Service
```bash
cd [component-dir]
docker-compose restart [service-name]
```

### View Logs
```bash
docker logs -f ridebnb-[service-name]
```

### Clean Volumes (CAUTION: Deletes Data)
```bash
docker-compose down -v
```

## 📊 Networking

All services communicate via `ridebnb-network` bridge:

```
bsc-node:8545       ← Graph Node connects here
graph-node:8000     ← Frontend connects here
frontend:3000       ← Nginx proxies here
```

## 💾 Data Volumes

- `bsc-data` - ~800GB (blockchain data)
- `postgres-data` - Varies (subgraph indexed data)
- `ipfs-data` - ~10GB (IPFS blocks)
- `nginx-logs` - ~1GB (access/error logs)

## 🔍 Health Checks

Each service has health checks:

```bash
# Check all healthy
docker ps --format "table {{.Names}}\t{{.Status}}"

# Should show (healthy) for each
```

## 📖 See Also

- [../QUICKSTART.md](../QUICKSTART.md) - Fast deployment guide
- [../VPS_DEPLOYMENT.md](../VPS_DEPLOYMENT.md) - Complete manual
- [../SSL_SETUP.md](../SSL_SETUP.md) - HTTPS configuration
