#!/bin/bash

# Health check script for all VPS services
# Run with: ./health-check.sh

VPS_IP="${VPS_IP:-86.107.77.113}"

echo "🏥 RideBNB Infrastructure Health Check"
echo "======================================"
echo ""

# Function to check HTTP endpoint
check_http() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Checking  $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null)
    
    if [ "$response" = "$expected" ]; then
        echo "✅ OK ($response)"
        return 0
    else
        echo "❌ FAILED (got $response, expected $expected)"
        return 1
    fi
}

# Function to check JSON-RPC endpoint
check_rpc() {
    local name=$1
    local url=$2
    local method=$3
    
    echo -n "Checking $name... "
    response=$(curl -s -X POST -H "Content-Type: application/json" \
        --data "{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":[],\"id\":1}" \
        $url 2>/dev/null)
    
    if echo "$response" | grep -q "result"; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAILED"
        echo "   Response: $response"
        return 1
    fi
}

# Check Docker containers
echo "📦 Docker Containers:"
echo "-------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep ridebnb || echo "No containers running"
echo ""

# Check BSC Node
echo "⛓️  BSC Node:"
echo "----------"
check_rpc "RPC Endpoint" "http://$VPS_IP:8545" "eth_blockNumber"
check_rpc "WebSocket" "http://$VPS_IP:8546" "eth_blockNumber"

# Get current block
block_hex=$(curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://$VPS_IP:8545 | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
block_dec=$((16#${block_hex#0x}))
echo "   Current block: $block_dec"

# Check sync status
sync_status=$(curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}' \
    http://$VPS_IP:8545)
if echo "$sync_status" | grep -q '"result":false'; then
    echo "   ✅ Fully synced"
else
    echo "   ⏳ Still syncing..."
fi
echo ""

# Check PostgreSQL
echo "🗄️  PostgreSQL:"
echo "------------"
if docker exec ridebnb-postgres pg_isready -U graph-node &>/dev/null; then
    echo "   ✅ Database ready"
    
    # Get database size
    db_size=$(docker exec ridebnb-postgres psql -U graph-node -d graph-node -t -c \
        "SELECT pg_size_pretty(pg_database_size('graph-node'));" 2>/dev/null | xargs)
    echo "   Database size: $db_size"
else
    echo "   ❌ Database not responding"
fi
echo ""

# Check IPFS
echo "📦 IPFS:"
echo "------"
ipfs_id=$(curl -s http://$VPS_IP:5001/api/v0/id 2>/dev/null)
if [ ! -z "$ipfs_id" ]; then
    echo "   ✅ IPFS running"
    peer_id=$(echo "$ipfs_id" | grep -o '"ID":"[^"]*"' | cut -d'"' -f4 | head -1)
    echo "   Peer ID: ${peer_id:0:20}..."
else
    echo "   ❌ IPFS not responding"
fi
echo ""

# Check Graph Node
echo "📊 Graph Node:"
echo "-----------"
check_http "GraphQL HTTP" "http://$VPS_IP:8000/" "400"
check_http "Admin API" "http://$VPS_IP:8020/" "200"

# Check subgraph status
subgraph_status=$(curl -s http://$VPS_IP:8030/graphql -X POST \
    -H "Content-Type: application/json" \
    --data '{"query":"{ indexingStatuses { subgraph synced health fatalError { message } } }"}' 2>/dev/null)

if echo "$subgraph_status" | grep -q '"synced":true'; then
    echo "   ✅ Subgraph synced"
elif echo "$subgraph_status" | grep -q '"synced":false'; then
    echo "   ⏳ Subgraph syncing..."
else
    echo "   ⚠️  No subgraph deployed"
fi
echo ""

# Check Frontend
echo "🎨 Frontend:"
echo "---------"
check_http "Next.js App" "http://$VPS_IP:3000" "200"
check_http "Nginx Proxy" "http://$VPS_IP" "200"
check_http "Health Endpoint" "http://$VPS_IP/health" "200"
echo ""

# Check Disk Space
echo "💾 Disk Space:"
echo "-----------"
df -h / | tail -1 | awk '{print "   Root: " $3 " used / " $2 " total (" $5 " used)"}'
df -h /var/lib/docker 2>/dev/null | tail -1 | awk '{print "   Docker: " $3 " used / " $2 " total (" $5 " used)"}'
echo ""

# Check Memory
echo "🧠 Memory:"
echo "-------"
free -h | grep Mem | awk '{print "   Total: " $2 "  Used: " $3 "  Free: " $4}'
echo ""

# Docker stats (running containers)
echo "📊 Container Resources:"
echo "--------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep ridebnb
echo ""

echo "======================================"
echo "Health check complete! ✅"
echo "======================================"
