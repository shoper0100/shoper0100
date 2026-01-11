#!/bin/bash
# RideBNB Frontend - VPS Setup Script
# Run this on your VPS after transferring the package

set -e

echo "🚀 Starting RideBNB deployment..."

# Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Create app directory
echo "📁 Setting up application..."
mkdir -p /var/www/ridebnb
cd /var/www/ridebnb

# Extract files
echo "📂 Extracting files..."
tar -xzf /tmp/ridebnb.tar.gz

# Create environment file
echo "⚙️ Creating environment configuration..."
cat > .env.local << 'EOF'
NEXT_PUBLIC_RIDEBNB_ADDRESS=0x7Ae3BcEBBC1e9F08A103B3920907805Fa8607627
NEXT_PUBLIC_ROYALTY_ADDRESS=0xB07ccB285B78bd9e8cf35BDe865DBeEBB6106b52
NEXT_PUBLIC_CHAIN_ID=5611
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_EXPLORER_URL=https://opbnb-testnet.bscscan.com
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 delete ridebnb 2>/dev/null || true
pm2 start npm --name ridebnb -- start
pm2 save
pm2 startup | tail -1 | bash

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/ridebnb << 'EOF'
server {
    listen 80;
    server_name 145.223.19.208;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/ridebnb /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx

echo ""
echo "✅ Deployment Complete!"
echo "=================================="
echo "🌐 Frontend URL: http://145.223.19.208"
echo "📊 PM2 Status:"
pm2 status
echo "=================================="
echo ""
echo "Useful commands:"
echo "  pm2 logs ridebnb    - View logs"
echo "  pm2 restart ridebnb - Restart app"
echo "  pm2 monit           - Monitor"
