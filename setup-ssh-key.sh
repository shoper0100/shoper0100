#!/bin/bash
# Setup SSH Key for RideBNB VPS (Linux/Mac)

VPS_IP="${VPS_IP:-86.107.77.113}"
VPS_USER="${VPS_USER:-root}"
EMAIL="${EMAIL:-admin@ridebnb.local}"
KEY_PATH="$HOME/.ssh/ridebnb_vps"

echo "🔑 Setting up SSH key authentication"
echo "VPS: $VPS_IP"
echo ""

# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Check if key exists
if [ -f "$KEY_PATH" ]; then
    echo "⚠️  SSH key already exists at $KEY_PATH"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Generate SSH key
echo "📝 Generating SSH key..."
ssh-keygen -t ed25519 -C "$EMAIL" -f "$KEY_PATH" -N ""

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate SSH key"
    exit 1
fi

echo "✅ SSH key generated"
echo "   Private: $KEY_PATH"
echo "   Public:  $KEY_PATH.pub"
echo ""

# Display public key
echo "📋 Your public key:"
echo "----------------------------------------"
cat "$KEY_PATH.pub"
echo "----------------------------------------"
echo ""

# Copy to VPS
echo "📤 Copying public key to VPS..."
echo "⚠️  You'll need to enter your VPS password ONE LAST TIME"
echo ""

# Try ssh-copy-id first
if command -v ssh-copy-id &> /dev/null; then
    ssh-copy-id -i "$KEY_PATH.pub" "$VPS_USER@$VPS_IP"
else
    # Fallback to manual method
    cat "$KEY_PATH.pub" | ssh "$VPS_USER@$VPS_IP" \
        "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
fi

if [ $? -ne 0 ]; then
    echo "❌ Failed to copy key to VPS"
    exit 1
fi

echo "✅ Public key copied to VPS"
echo ""

# Test connection
echo "🧪 Testing SSH key authentication..."
ssh -i "$KEY_PATH" -o "BatchMode=yes" -o "PasswordAuthentication=no" "$VPS_USER@$VPS_IP" "echo 'SSH key works!'" &>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ SSH key authentication successful!"
else
    echo "⚠️  Could not verify automatically, but key was installed"
    echo "   Test with: ssh -i $KEY_PATH $VPS_USER@$VPS_IP"
fi
echo ""

# Create/Update SSH config
echo "⚙️  Updating SSH config..."
CONFIG_PATH="$HOME/.ssh/config"

# Check if entry already exists
if [ -f "$CONFIG_PATH" ] && grep -q "Host ridebnb-vps" "$CONFIG_PATH"; then
    echo "⚠️  SSH config entry already exists"
else
    cat >> "$CONFIG_PATH" << EOF

# RideBNB VPS
Host ridebnb-vps
    HostName $VPS_IP
    User $VPS_USER
    IdentityFile $KEY_PATH
    IdentitiesOnly yes

EOF
    chmod 600 "$CONFIG_PATH"
    echo "✅ SSH config updated"
fi
echo ""

# Summary
echo "================================"
echo "🎉 SSH Key Setup Complete!"
echo "================================"
echo ""
echo "📝 Connection methods:"
echo "   Quick:  ssh ridebnb-vps"
echo "   Full:   ssh -i $KEY_PATH $VPS_USER@$VPS_IP"
echo ""
echo "🔒 Security (Recommended Next Steps):"
echo "   1. Test connection: ssh ridebnb-vps"
echo "   2. Update deployment scripts to use SSH key"
echo "   3. Disable password auth on VPS (see SSH_KEY_SETUP.md)"
echo ""
echo "🚀 Ready to deploy:"
echo "   ./deploy-to-vps.sh"
echo ""
