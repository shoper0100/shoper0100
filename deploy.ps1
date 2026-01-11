# RideBNB Frontend - Automated VPS Deployment
# VPS: 145.223.19.208

Write-Host "🚀 RideBNB Frontend Deployment Starting..." -ForegroundColor Green
Write-Host ""

$VPS_IP = "145.223.19.208"
$VPS_USER = "root"
$APP_DIR = "/var/www/ridebnb"
$LOCAL_DIR = "f:\ridebnb"

# Step 1: Build locally
Write-Host "📦 Step 1: Building Next.js application..." -ForegroundColor Cyan
Set-Location $LOCAL_DIR
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Step 2: Create deployment package
Write-Host "📦 Step 2: Creating deployment package..." -ForegroundColor Cyan
$TEMP_DIR = "$env:TEMP\ridebnb-deploy"
if (Test-Path $TEMP_DIR) {
    Remove-Item -Recurse -Force $TEMP_DIR
}
New-Item -ItemType Directory -Path $TEMP_DIR | Out-Null

# Copy necessary files
Copy-Item -Recurse ".next" "$TEMP_DIR\.next"
Copy-Item -Recurse "public" "$TEMP_DIR\public"
Copy-Item "package.json" "$TEMP_DIR\"
Copy-Item "package-lock.json" "$TEMP_DIR\"
Copy-Item "next.config.ts" "$TEMP_DIR\"

# Create .env.local
$envContent = @"
NEXT_PUBLIC_RIDEBNB_ADDRESS=0x7Ae3BcEBBC1e9F08A103B3920907805Fa8607627
NEXT_PUBLIC_ROYALTY_ADDRESS=0xB07ccB285B78bd9e8cf35BDe865DBeEBB6106b52
NEXT_PUBLIC_CHAIN_ID=5611
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_EXPLORER_URL=https://opbnb-testnet.bscscan.com
"@
$envContent | Out-File -FilePath "$TEMP_DIR\.env.local" -Encoding UTF8

Write-Host "✅ Package created!" -ForegroundColor Green
Write-Host ""

# Step 3: Transfer to VPS
Write-Host "📤 Step 3: Transferring files to VPS..." -ForegroundColor Cyan
Write-Host "Creating archive..." 

# Create tar.gz archive
tar -czf "$env:TEMP\ridebnb-deploy.tar.gz" -C $TEMP_DIR .

Write-Host "Uploading to VPS..."
scp "$env:TEMP\ridebnb-deploy.tar.gz" "${VPS_USER}@${VPS_IP}:/tmp/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ File transfer failed! Check SSH access." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Files transferred!" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy on VPS
Write-Host "🔧 Step 4: Setting up VPS..." -ForegroundColor Cyan

$vpsScript = @"
#!/bin/bash
set -e

echo '🔧 Installing Node.js if needed...'
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo '🔧 Installing PM2 if needed...'
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo '🔧 Installing Nginx if needed...'
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

echo '📁 Setting up application directory...'
mkdir -p $APP_DIR
cd $APP_DIR

echo '📦 Extracting files...'
rm -rf .next public package.json package-lock.json next.config.ts .env.local
tar -xzf /tmp/ridebnb-deploy.tar.gz -C $APP_DIR
rm /tmp/ridebnb-deploy.tar.gz

echo '📦 Installing dependencies...'
npm ci --production

echo '⚙️ Configuring PM2...'
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ridebnb',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

echo '🔄 Restarting application...'
pm2 delete ridebnb 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | grep -v 'PM2' | bash || true

echo '🌐 Configuring Nginx...'
cat > /etc/nginx/sites-available/ridebnb << 'EOF'
server {
    listen 80;
    server_name $VPS_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ridebnb /etc/nginx/sites-enabled/ridebnb
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo '✅ Deployment complete!'
echo '🌐 Frontend accessible at: http://$VPS_IP'

pm2 status
"@

# Save script to temp file
$vpsScript | Out-File -FilePath "$env:TEMP\deploy-vps.sh" -Encoding UTF8

# Upload and execute script
scp "$env:TEMP\deploy-vps.sh" "${VPS_USER}@${VPS_IP}:/tmp/"
ssh "${VPS_USER}@${VPS_IP}" "chmod +x /tmp/deploy-vps.sh && /tmp/deploy-vps.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ VPS setup failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend URL: http://$VPS_IP" -ForegroundColor Cyan
Write-Host "📊 Check status: ssh ${VPS_USER}@${VPS_IP} 'pm2 status'" -ForegroundColor Yellow
Write-Host "📋 View logs: ssh ${VPS_USER}@${VPS_IP} 'pm2 logs ridebnb'" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 RideBNB is now live!" -ForegroundColor Green
