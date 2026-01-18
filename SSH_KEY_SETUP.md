# SSH Key Setup Guide - Passwordless VPS Access

## 🔑 Quick Setup (Windows)

### Step 1: Generate SSH Key Pair

Open PowerShell and run:

```powershell
# Create .ssh directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $HOME\.ssh

# Generate SSH key pair
ssh-keygen -t ed25519 -C "your-email@example.com" -f $HOME\.ssh\ridebnb_vps

# Or for older systems, use RSA:
# ssh-keygen -t rsa -b 4096 -C "your-email@example.com" -f $HOME\.ssh\ridebnb_vps
```

**When prompted:**
- Enter passphrase (optional but recommended): `yourpassphrase`
- Confirm passphrase

**Output:**
```
Generating public/private ed25519 key pair.
Your identification has been saved in C:\Users\YourName\.ssh\ridebnb_vps
Your public key has been saved in C:\Users\YourName\.ssh\ridebnb_vps.pub
```

### Step 2: Copy Public Key to VPS

**Option A: Using ssh-copy-id (if available)**
```powershell
# Install OpenSSH Client if needed (Windows 10/11)
# Settings > Apps > Optional Features > Add OpenSSH Client

# Copy key to VPS
type $HOME\.ssh\ridebnb_vps.pub | ssh root@86.107.77.113 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**Option B: Manual Copy**
```powershell
# Display your public key
Get-Content $HOME\.ssh\ridebnb_vps.pub

# Copy the output, then SSH into VPS with password:
ssh root@86.107.77.113

# On VPS, run:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste your public key, save (Ctrl+X, Y, Enter)
chmod 600 ~/.ssh/authorized_keys
exit
```

### Step 3: Test SSH Key Authentication

```powershell
# Test connection (should NOT ask for password)
ssh -i $HOME\.ssh\ridebnb_vps root@86.107.77.113

# If successful, you'll be logged in without password!
```

### Step 4: Configure SSH Client (Optional)

Create/edit SSH config file:

```powershell
notepad $HOME\.ssh\config
```

Add:
```
Host ridebnb-vps
    HostName 86.107.77.113
    User root
    IdentityFile C:\Users\YourName\.ssh\ridebnb_vps
    IdentitiesOnly yes
```

**Now you can connect with just:**
```powershell
ssh ridebnb-vps
```

### Step 5: Disable Password Authentication (Secure VPS)

After confirming SSH key works:

```bash
# SSH into VPS
ssh ridebnb-vps

# Backup SSH config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH config
nano /etc/ssh/sshd_config
```

Change these lines:
```
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin prohibit-password
```

Save and restart SSH:
```bash
systemctl restart sshd
```

---

## 🐧 Quick Setup (Linux/Mac)

### Step 1: Generate SSH Key

```bash
# Generate key
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/ridebnb_vps

# View public key
cat ~/.ssh/ridebnb_vps.pub
```

### Step 2: Copy to VPS

```bash
# Using ssh-copy-id
ssh-copy-id -i ~/.ssh/ridebnb_vps.pub root@86.107.77.113

# Or manually
cat ~/.ssh/ridebnb_vps.pub | ssh root@86.107.77.113 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Step 3: Test Connection

```bash
ssh -i ~/.ssh/ridebnb_vps root@86.107.77.113
```

### Step 4: Add to SSH Config

```bash
nano ~/.ssh/config
```

Add:
```
Host ridebnb-vps
    HostName 86.107.77.113
    User root
    IdentityFile ~/.ssh/ridebnb_vps
```

Now connect with:
```bash
ssh ridebnb-vps
```

---

## 🤖 Automated Setup Script (PowerShell)

Save as `setup-ssh-key.ps1`:

```powershell
# Setup SSH Key for RideBNB VPS
param(
    [string]$VpsIp = "86.107.77.113",
    [string]$VpsUser = "root",
    [string]$Email = "admin@ridebnb.local"
)

$KeyPath = "$HOME\.ssh\ridebnb_vps"

Write-Host "🔑 Setting up SSH key authentication" -ForegroundColor Green
Write-Host "VPS: $VpsIp" -ForegroundColor Cyan

# Create .ssh directory
New-Item -ItemType Directory -Force -Path "$HOME\.ssh" | Out-Null

# Check if key already exists
if (Test-Path $KeyPath) {
    Write-Host "⚠️  SSH key already exists at $KeyPath" -ForegroundColor Yellow
    $continue = Read-Host "Overwrite? (y/N)"
    if ($continue -ne "y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit
    }
}

# Generate SSH key
Write-Host "`n📝 Generating SSH key..." -ForegroundColor Yellow
ssh-keygen -t ed25519 -C $Email -f $KeyPath -N '""'

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate SSH key" -ForegroundColor Red
    exit 1
}

Write-Host "✅ SSH key generated" -ForegroundColor Green

# Display public key
Write-Host "`n📋 Your public key:" -ForegroundColor Yellow
Get-Content "$KeyPath.pub"

# Copy to VPS
Write-Host "`n📤 Copying public key to VPS..." -ForegroundColor Yellow
Write-Host "You'll need to enter your VPS password one last time." -ForegroundColor Cyan

$pubKey = Get-Content "$KeyPath.pub" -Raw
$command = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'SSH key installed successfully'"

ssh "$VpsUser@$VpsIp" $command

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to copy key to VPS" -ForegroundColor Red
    exit 1
}

# Test connection
Write-Host "`n🧪 Testing SSH key authentication..." -ForegroundColor Yellow
$testResult = ssh -i $KeyPath -o "PasswordAuthentication=no" "$VpsUser@$VpsIp" "echo 'SSH key works!'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSH key authentication successful!" -ForegroundColor Green
} else {
    Write-Host "❌ SSH key authentication failed" -ForegroundColor Red
    exit 1
}

# Create SSH config
Write-Host "`n⚙️  Creating SSH config..." -ForegroundColor Yellow
$configPath = "$HOME\.ssh\config"
$configEntry = @"

# RideBNB VPS
Host ridebnb-vps
    HostName $VpsIp
    User $VpsUser
    IdentityFile $KeyPath
    IdentitiesOnly yes
"@

Add-Content -Path $configPath -Value $configEntry
Write-Host "✅ SSH config updated" -ForegroundColor Green

# Summary
Write-Host "`n================================" -ForegroundColor Green
Write-Host "🎉 SSH Key Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "`n📝 Connection methods:" -ForegroundColor Cyan
Write-Host "   Quick:  ssh ridebnb-vps" -ForegroundColor White
Write-Host "   Full:   ssh -i $KeyPath $VpsUser@$VpsIp" -ForegroundColor White
Write-Host "`n🔒 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test: ssh ridebnb-vps" -ForegroundColor White
Write-Host "   2. Disable password auth (see SSH_KEY_SETUP.md)" -ForegroundColor White
Write-Host ""
