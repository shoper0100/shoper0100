#!/bin/bash

# Quick deployment script for Graph Node subgraph
# Run this on VPS after Graph Node is running

set -e

GRAPH_NODE_URL="http://localhost:8020"
IPFS_URL="http://localhost:5001"
SUBGRAPH_NAME="ridebnb"

echo "🗂️  Deploying RideBNB Subgraph"
echo "=============================="

# Check if Graph CLI is installed
if ! command -v graph &> /dev/null; then
    echo "📦 Installing Graph CLI..."
    npm install -g @graphprotocol/graph-cli
fi

echo "📝 Graph CLI version: $(graph --version)"

# Navigate to subgraph directory
cd /opt/ridebnb/subgraph

# Generate code from schema
echo "🔧 Generating code from GraphQL schema..."
graph codegen

# Build the subgraph
echo "🏗️  Building subgraph..."
graph build

# Create subgraph (if not exists)
echo "📋 Creating subgraph..."
graph create --node $GRAPH_NODE_URL $SUBGRAPH_NAME 2>/dev/null || echo "Subgraph already exists"

# Deploy subgraph
echo "🚀 Deploying subgraph..."
graph deploy --node $GRAPH_NODE_URL --ipfs $IPFS_URL $SUBGRAPH_NAME

echo ""
echo "✅ Subgraph deployed successfully!"
echo ""
echo "📍 GraphQL Endpoint:"
echo "   http://localhost:8000/subgraphs/name/$SUBGRAPH_NAME"
echo ""
echo "🔍 Test query:"
echo "   curl http://localhost:8000/subgraphs/name/$SUBGRAPH_NAME \\"
echo "     -X POST \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     --data '{\"query\":\"{ _meta { block { number } } }\"}'"
echo ""
