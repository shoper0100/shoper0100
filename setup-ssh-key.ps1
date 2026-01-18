# Setup SSH Key for RideBNB VPS
param(
    [string]$VpsIp = "86.107.77.113",
    [string]$VpsUser = "root",
    [string]$Email = "admin@ridebnb.local"
)

$KeyPath = "$HOME\.ssh\ridebnb_vps"

Write-Host "Setting up SSH key authentication" -ForegroundColor Green
Write-Host "VPS: $VpsIp" -ForegroundColor Cyan
Write-Host ""

# Create .ssh directory
New-Item -ItemType Directory -Force -Path "$HOME\.ssh" | Out-Null

# Check if key already exists
if (Test-Path $KeyPath) {
    Write-Host "WARNING: SSH key already exists at $KeyPath" -ForegroundColor Yellow
    $continue = Read-Host "Overwrite? (y/N)"
    if ($continue -ne "y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit
    }
}

# Generate SSH key
Write-Host "Generating SSH key..." -ForegroundColor Yellow
ssh-keygen -t ed25519 -C $Email -f $KeyPath -N '""'

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to generate SSH key" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: SSH key generated" -ForegroundColor Green
Write-Host "   Private: $KeyPath" -ForegroundColor Gray
Write-Host "   Public:  $KeyPath.pub" -ForegroundColor Gray

# Display public key
Write-Host ""
Write-Host "Your public key:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Get-Content "$KeyPath.pub"
Write-Host "----------------------------------------" -ForegroundColor Gray

# Copy to VPS
Write-Host ""
Write-Host "Copying public key to VPS..." -ForegroundColor Yellow
Write-Host "You'll need to enter your VPS password ONE LAST TIME" -ForegroundColor Cyan
Write-Host ""

$pubKey = Get-Content "$KeyPath.pub" -Raw
# Build the remote command (runs on VPS bash)
$remoteCommand = @"
mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'SSH key installed successfully'
"@

ssh "$VpsUser@$VpsIp" $remoteCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to copy key to VPS" -ForegroundColor Red
    exit 1
}

# Test connection
Write-Host ""
Write-Host "Testing SSH key authentication..." -ForegroundColor Yellow
$testResult = ssh -i $KeyPath -o "BatchMode=yes" -o "PasswordAuthentication=no" "$VpsUser@$VpsIp" "echo 'SSH key works!'" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: SSH key authentication successful!" -ForegroundColor Green
}
else {
    Write-Host "WARNING: Could not verify automatically, but key was installed" -ForegroundColor Yellow
    Write-Host "   Test with: ssh -i $KeyPath $VpsUser@$VpsIp" -ForegroundColor Gray
}

# Create/Update SSH config
Write-Host ""
Write-Host "Updating SSH config..." -ForegroundColor Yellow
$configPath = "$HOME\.ssh\config"

# Check if entry already exists
$configExists = $false
if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw
    if ($configContent -match "Host ridebnb-vps") {
        $configExists = $true
        Write-Host "WARNING: SSH config entry already exists" -ForegroundColor Yellow
    }
}

if (-not $configExists) {
    $configEntry = @"

# RideBNB VPS
Host ridebnb-vps
    HostName $VpsIp
    User $VpsUser
    IdentityFile $KeyPath
    IdentitiesOnly yes

"@
    Add-Content -Path $configPath -Value $configEntry
    Write-Host "SUCCESS: SSH config updated" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "SSH Key Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Connection methods:" -ForegroundColor Cyan
Write-Host "   Quick:  " -NoNewline
Write-Host "ssh ridebnb-vps" -ForegroundColor White
Write-Host "   Full:   " -NoNewline
Write-Host "ssh -i $KeyPath $VpsUser@$VpsIp" -ForegroundColor White
Write-Host ""
Write-Host "Security (Recommended Next Steps):" -ForegroundColor Cyan
Write-Host "   1. Test connection: " -NoNewline
Write-Host "ssh ridebnb-vps" -ForegroundColor White
Write-Host "   2. Update deployment scripts to use SSH key" -ForegroundColor White
Write-Host "   3. Disable password auth on VPS (see SSH_KEY_SETUP.md)" -ForegroundColor White
Write-Host ""
Write-Host "Ready to deploy:" -ForegroundColor Cyan
Write-Host "   .\deploy-to-vps.ps1" -ForegroundColor White
Write-Host ""
