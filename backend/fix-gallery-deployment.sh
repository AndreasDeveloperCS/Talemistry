#!/bin/bash

# Gallery Photo Upload Fix - Production Deployment Script
# This script ensures the backend is properly rebuilt and restarted

set -e  # Exit on any error

echo "=========================================="
echo "Gallery Photo Upload - Production Fix"
echo "=========================================="

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "📦 Installing/updating backend dependencies..."
npm install

echo "🔨 Building backend with clean state..."
# Clean build to ensure all controllers are properly registered
rm -rf dist
npm run build

echo "🔍 Verifying build artifacts..."
if [ ! -f "dist/main.js" ]; then
    echo "❌ ERROR: Build failed - dist/main.js not found!"
    exit 1
fi

# Verify the controller was built
if grep -r "photo-gallery" dist/app/modules/companies/controllers/ > /dev/null 2>&1; then
    echo "✅ Gallery endpoint found in built files"
else
    echo "⚠️  WARNING: Gallery endpoint not found in dist - this might be a problem"
fi

echo "🔄 Restarting PM2 process..."
pm2 delete TALEMISTRY || true
pm2 start ecosystem.config.js
pm2 save

echo "⏳ Waiting for application to start..."
sleep 5

echo "✅ Deployment complete!"
echo ""
echo "🧪 Testing the endpoint..."
echo "You can test with:"
echo "curl -X GET https://evryka.org/api/companies-verified/68c977520527632943404ae7/photo-gallery"
echo ""
echo "📊 Check PM2 logs:"
echo "pm2 logs TALEMISTRY --lines 100"
