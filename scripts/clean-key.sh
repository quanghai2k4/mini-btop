#!/bin/bash
set -e

KEY_NAME="${1:-mini-btop}"
KEY_PATH="$HOME/.ssh/$KEY_NAME"

echo "==> Cleaning SSH key: $KEY_NAME"
echo ""

# 1. Delete from AWS
echo "[1/2] Checking AWS key pair..."
if aws ec2 describe-key-pairs --key-names "$KEY_NAME" &>/dev/null; then
    read -p "      Delete key '$KEY_NAME' from AWS? [y/N]: " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        aws ec2 delete-key-pair --key-name "$KEY_NAME"
        echo "      Deleted from AWS: $KEY_NAME"
    else
        echo "      Skipped AWS deletion"
    fi
else
    echo "      AWS key not found: $KEY_NAME (skipping)"
fi

# 2. Delete local key
echo ""
echo "[2/2] Checking local key..."
if [ -f "$KEY_PATH" ]; then
    read -p "      Delete local key? ($KEY_PATH) [y/N]: " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        rm -f "$KEY_PATH" "$KEY_PATH.pub"
        echo "      Deleted: $KEY_PATH"
        echo "      Deleted: $KEY_PATH.pub"
    else
        echo "      Skipped local deletion"
    fi
else
    echo "      Local key not found: $KEY_PATH (skipping)"
fi

echo ""
echo "==> Done!"
