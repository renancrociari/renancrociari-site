#!/bin/bash

# SSL Setup Script for Local HTTPS Development
# 
# This script generates local SSL certificates using mkcert
# for HTTPS development with Parcel

set -e

echo "🔒 Setting up SSL certificates for local development..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert is not installed. Installing via Homebrew..."
    
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is not installed. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    brew install mkcert
fi

# Install the local CA
echo "📜 Installing local Certificate Authority..."
mkcert -install

# Generate certificates for localhost
echo "🔐 Generating SSL certificates..."
cd "$(dirname "$0")/.."

# Generate certificate for localhost, 127.0.0.1, and ::1
mkcert localhost 127.0.0.1 ::1

# Rename to match project naming convention
if [ -f "localhost+2.pem" ]; then
    mv localhost+2.pem localhost+3.pem
    mv localhost+2-key.pem localhost+3-key.pem
elif [ -f "localhost.pem" ]; then
    mv localhost.pem localhost+3.pem
    mv localhost-key.pem localhost+3-key.pem
fi

echo "✅ SSL certificates created successfully!"
echo ""
echo "📁 Files created:"
echo "   - localhost+3.pem (certificate)"
echo "   - localhost+3-key.pem (private key)"
echo ""
echo "🚀 You can now run: npm start"
echo "   Server will be available at https://localhost:1234"
