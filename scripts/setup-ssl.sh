#!/bin/bash

# SSL Setup Script for Local HTTPS Development
# 
# Generates local SSL certificates for HTTPS development with Parcel.
# Uses mkcert (preferred) or openssl (fallback).

set -e

cd "$(dirname "$0")/.."

echo "🔒 Setting up SSL certificates for local development..."

# Method 1: mkcert (preferred - trusted by browsers)
if command -v mkcert &> /dev/null; then
    echo "✅ Using mkcert (recommended)..."
    mkcert -install
    mkcert localhost 127.0.0.1 ::1

    # Rename to match project naming convention
    if [ -f "localhost+2.pem" ]; then
        mv localhost+2.pem localhost+3.pem
        mv localhost+2-key.pem localhost+3-key.pem
    elif [ -f "localhost.pem" ]; then
        mv localhost.pem localhost+3.pem
        mv localhost-key.pem localhost+3-key.pem
    fi

    echo "✅ SSL certificates created with mkcert (browser-trusted)!"
    echo "🚀 Run: npm start"
    exit 0
fi

# Method 2: openssl (fallback - self-signed, browser will warn)
if command -v openssl &> /dev/null; then
    echo "⚠️  mkcert not found. Using openssl (self-signed certificate)..."
    echo "   Note: Browser will show security warning. Accept to proceed."
    echo ""

    # Generate self-signed certificate valid for 365 days
    openssl req -x509 -newkey rsa:2048 -keyout localhost+3-key.pem \
        -out localhost+3.pem -days 365 -nodes \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"

    echo "✅ Self-signed SSL certificates created!"
    echo "⚠️  Browser will warn about untrusted certificate - this is normal."
    echo "🚀 Run: npm start"
    exit 0
fi

# No method available
echo "❌ Neither mkcert nor openssl found."
echo ""
echo "Install options:"
echo "  Option 1 (recommended): brew install mkcert"
echo "  Option 2: Use HTTP instead: npm run dev:all"
exit 1
