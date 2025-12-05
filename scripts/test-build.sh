#!/bin/bash

# Simple test to verify the release build process
# This script builds a single platform to test the process quickly

set -e

echo "🧪 Testing release build process..."
echo ""

# Clean
echo "🧹 Cleaning..."
rm -rf web/dist/
rm -rf internal/server/static/*
mkdir -p internal/server/static

# Build frontend
echo "🎨 Building frontend..."
cd web
npm install --silent
npm run build --silent
cd ..

echo "✅ Frontend built to internal/server/static/"
ls -la internal/server/static/

# Build backend for current platform only (quick test)
echo ""
echo "🔨 Building backend for current platform..."
go build -o test-weblogview ./cmd

echo ""
echo "✅ Test build successful!"
echo ""
echo "To test the executable:"
echo "  ./test-weblogview"
echo ""
echo "Clean up test binary:"
echo "  rm test-weblogview"
