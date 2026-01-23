$VPS_HOST = "root@86.107.77.113"

Write-Host "🚀 Starting VPS Deployment..." -ForegroundColor Cyan
Write-Host "================================`n"

# Step 1: Setup SSH Key
Write-Host "📝 Step 1: Setting up SSH key..." -ForegroundColor Yellow
$sshKeyCommand = @"
mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDZDnsWkgYMTJL6Y/fjffJHpnS9ki8ZsE6uO7T4QqdRfRWMMJtaUnvwWccbF8AIqlCVSivv3QZFJmYGwSo7KSFS84YmbWnqKhw0i/5chwjmUQ/miG7kKgRmZeRozIKVfP2QJZOkuxJ/iGZacKLyL3Ayow1pXDIKyY6R6JDA/Hrd12rpbIYOG5yQeIhYkBfhmWhxTgDpwUs32NYQBjyoMSb3UF8KpzvdxEcdhWPA1ii6vHuzfu9XQlpqMEn26vn9D575Lc/At0W/6yLv0US0Fk2v71cCRcFiNGMQ9U9DLPP3bER5mSv1WcNap3Y8OJhsC6Cq5ArLWLmexRpQ8FqhB6saqvXHwtwRGCY+aqOoD9WKdFeqnTYzR/B2Ubf6OpNNdck+8CR7JLXdRJ4ewYFw/zTpwCCU17Egdfbg0Z2RpV+LwtfQjqCvdlbeRzx+klVBnMiOqFCXkSXruxXjVo8lEd+3EQNrVaXLzGVvFp8DvgOxxAdhaoZB2U27ryp2fXNDnQGkStkqsDAx6QPKwFHyVD8ETjUIE9v5i4LLEU7REjIeu5fFkk1xA2++4VotEoZzEUELggASy+/RjYIafUcI1R8L+eMIZ9AE+Y8fdOZPqR82A4LqL055OOY58JJc+na5HFL3ERsLRbE/AYLBl6KcuFLvQLdPdgALmFUvuN1fznhzrw== user@vipechan' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'SSH key installed'
"@

# Step 2: Pull code
Write-Host "`n📥 Step 2: Pulling latest code..." -ForegroundColor Yellow
$pullCommand = "cd /root/ridebnb && git pull origin master"

# Step 3: Deploy
Write-Host "`n🐳 Step 3: Building and deploying Docker container..." -ForegroundColor Yellow
$deployCommand = "cd /root/ridebnb/webapp && docker-compose up -d --build"

# Step 4: Verify
Write-Host "`n✓ Step 4: Verifying deployment..." -ForegroundColor Yellow
$verifyCommand = "cd /root/ridebnb/webapp && docker-compose ps && echo '' && docker-compose logs --tail=30"

Write-Host "`n⚠️  PASSWORD REQUIRED" -ForegroundColor Red
Write-Host "Please run these commands manually:" -ForegroundColor Yellow
Write-Host "`nssh $VPS_HOST" -ForegroundColor Cyan
Write-Host "`nThen copy/paste:`n"
Write-Host $sshKeyCommand -ForegroundColor White
Write-Host "`n$pullCommand" -ForegroundColor White
Write-Host "`n$deployCommand" -ForegroundColor White  
Write-Host "`n$verifyCommand" -ForegroundColor White
Write-Host "`n================================"
Write-Host "✅ After deployment, access at: http://86.107.77.113:3000" -ForegroundColor Green
