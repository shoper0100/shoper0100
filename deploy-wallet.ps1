# Quick deployment script for wallet enhancements
# Run this from f:\ridebnb directory

Write-Host "🚀 Deploying Wallet Enhancements to VPS..." -ForegroundColor Cyan

# Upload WalletConnect component
Write-Host "`n📤 Uploading WalletConnect.tsx..." -ForegroundColor Yellow
scp components/wallet/WalletConnect.tsx root@145.223.19.208:/var/www/ridebnb/components/wallet/

Write-Host "`n✅ Upload complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps on VPS:" -ForegroundColor Cyan
Write-Host "  cd /var/www/ridebnb"
Write-Host "  pm2 stop ridebnb"
Write-Host "  npm run build"
Write-Host "  pm2 start npm --name ridebnb -- start"
Write-Host "  pm2 save"
Write-Host "  pm2 logs ridebnb --lines 20"
Write-Host "`n🌐 Then visit: http://145.223.19.208" -ForegroundColor Green
