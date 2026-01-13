#!/bin/bash
set -e

KEY_NAME="${1:-mini-btop}"
KEY_PATH="$HOME/.ssh/$KEY_NAME"

echo "==> Setting up SSH key: $KEY_NAME"
echo ""

# Function to get local key fingerprint (SHA256)
get_local_fingerprint() {
    ssh-keygen -lf "$KEY_PATH.pub" 2>/dev/null | awk '{print $2}'
}

# Function to get AWS key fingerprint
get_aws_fingerprint() {
    # AWS returns MD5 fingerprint for imported keys, SHA256 for AWS-generated
    # We need to compute MD5 from local public key to compare
    ssh-keygen -ef "$KEY_PATH.pub" -m PEM 2>/dev/null | \
        openssl rsa -RSAPublicKey_in -outform DER 2>/dev/null | \
        openssl md5 -c 2>/dev/null | awk '{print $2}' || echo ""
}

get_aws_key_fingerprint() {
    aws ec2 describe-key-pairs --key-names "$KEY_NAME" \
        --query 'KeyPairs[0].KeyFingerprint' --output text 2>/dev/null || echo ""
}

# 1. Create local key if not exists
if [ -f "$KEY_PATH" ]; then
    echo "[1/3] Local key exists: $KEY_PATH"
    LOCAL_EXISTS=true
else
    echo "[1/3] Creating SSH key..."
    ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "$KEY_NAME-deploy"
    chmod 400 "$KEY_PATH"
    echo "      Created: $KEY_PATH"
    LOCAL_EXISTS=false
fi

# 2. Check AWS key pair
echo ""
if aws ec2 describe-key-pairs --key-names "$KEY_NAME" &>/dev/null; then
    echo "[2/3] AWS key pair exists: $KEY_NAME"
    AWS_EXISTS=true
    
    # Verify fingerprint match (for ed25519, compare public key directly)
    if [ "$LOCAL_EXISTS" = true ]; then
        echo ""
        echo "[3/3] Verifying key fingerprint..."
        
        # Get local public key content
        LOCAL_PUB=$(cat "$KEY_PATH.pub" | awk '{print $2}')
        
        # For ed25519 keys imported to AWS, we can verify by trying SSH
        # But simpler: warn user and let them decide
        echo ""
        echo "      Local key fingerprint:"
        ssh-keygen -lf "$KEY_PATH.pub"
        echo ""
        echo "      AWS key fingerprint:"
        aws ec2 describe-key-pairs --key-names "$KEY_NAME" \
            --query 'KeyPairs[0].KeyFingerprint' --output text
        echo ""
        
        read -p "      Does local key match AWS? [Y/n]: " confirm
        if [[ "$confirm" =~ ^[Nn]$ ]]; then
            echo ""
            echo "      Key mismatch! Options:"
            echo "        1. Use different key name: make up KEY_NAME=mini-btop-$(hostname)"
            echo "        2. Delete AWS key first:   make clean-key KEY_NAME=$KEY_NAME"
            echo ""
            exit 1
        fi
        echo "      Key verified!"
    fi
else
    echo "[2/3] AWS key pair not found, uploading..."
    aws ec2 import-key-pair \
        --key-name "$KEY_NAME" \
        --public-key-material fileb://"$KEY_PATH.pub"
    echo "      Uploaded to AWS: $KEY_NAME"
    AWS_EXISTS=false
    echo ""
    echo "[3/3] Key fingerprint:"
    ssh-keygen -lf "$KEY_PATH.pub"
fi

# Export key path for other tools
echo ""
echo "==> Done! SSH key ready: $KEY_NAME"
echo ""
echo "    Private key: $KEY_PATH"
echo "    Public key:  $KEY_PATH.pub"
echo ""

# Write key name to terraform.tfvars if not exists
TFVARS="terraform/terraform.tfvars"
if [ ! -f "$TFVARS" ]; then
    echo "key_name = \"$KEY_NAME\"" > "$TFVARS"
    echo "    Created: $TFVARS"
elif ! grep -q "key_name" "$TFVARS"; then
    echo "key_name = \"$KEY_NAME\"" >> "$TFVARS"
    echo "    Updated: $TFVARS"
fi
