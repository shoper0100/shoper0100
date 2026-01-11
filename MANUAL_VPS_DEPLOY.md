# Manual VPS Deployment Commands

## Step 1: Upload Files (Run on Local Machine)

### Open PowerShell and run:
```powershell
cd f:\ridebnb

# Upload the package (already created)
scp ridebnb-updated.tar.gz root@145.223.19.208:/tmp/
```

## Step 2: Deploy on VPS (SSH to VPS)

### Connect to VPS:
```powershell
ssh root@145.223.19.208
```

### Then run these commands:
```bash
# Navigate to app directory
cd /root/ridebnb

# Backup current build (optional)
mv .next .next.backup-$(date +%Y%m%d)

# Remove old files
rm -rf .next lib

# Extract new build
tar -xzf /tmp/ridebnb-updated.tar.gz

# Verify extraction
ls -la .next lib

# Restart PM2
pm2 restart ridebnb

# Save PM2 config
pm2 save

# Check status
pm2 status
pm2 logs ridebnb --lines 20

# Clean up
rm /tmp/ridebnb-updated.tar.gz
```

## Step 3: Verify Deployment

### Check the application:
```bash
# View logs
pm2 logs ridebnb --lines 50

# Check if running
curl http://localhost:3000
```

### Test in browser:
- Visit: http://145.223.19.208:3000
- Check browser console for contract addresses
- Should see: 0x9d02E94bDBCa308321023D6f4C949a55Fe0004aF

## If Issues Occur:

### Rollback:
```bash
cd /root/ridebnb
rm -rf .next lib
mv .next.backup-* .next
pm2 restart ridebnb
```

### Debug:
```bash
pm2 logs ridebnb --err --lines 100
pm2 describe ridebnb
```

## Contract Addresses to Verify:
- RideBNB: 0x9d02E94bDBCa308321023D6f4C949a55Fe0004aF
- Royalty: 0x37beB9241455EA436DEd9f9bDa7550237D507744
- Chain ID: 5611 (opBNB Testnet)
