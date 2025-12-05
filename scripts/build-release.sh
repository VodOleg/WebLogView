#!/bin/bash

# WebLogView Release Build Script
# Builds production-ready executables for all platforms

set -e  # Exit on error

echo "🚀 Building WebLogView Release..."
echo ""

# Get version from git tag or use default
VERSION=${VERSION:-$(git describe --tags --always --dirty 2>/dev/null || echo "dev")}
echo "📌 Version: $VERSION"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf web/dist/
mkdir -p dist/

# Step 1: Build Frontend
echo ""
echo "🎨 Building frontend (Vite production build)..."
cd web
npm install
npm run build
cd ..

echo "✅ Frontend built successfully!"
echo ""

# Step 2: Build Backend for all platforms
echo "🔨 Building backend for all platforms..."
echo ""

PLATFORMS=(
    "linux/amd64"
    "linux/arm64"
    "darwin/amd64"
    "darwin/arm64"
    "windows/amd64"
)

for platform in "${PLATFORMS[@]}"; do
    IFS='/' read -r GOOS GOARCH <<< "$platform"
    
    OUTPUT_NAME="weblogview-${GOOS}-${GOARCH}"
    if [ "$GOOS" = "windows" ]; then
        OUTPUT_NAME="${OUTPUT_NAME}.exe"
    fi
    
    echo "  📦 Building for $GOOS/$GOARCH..."
    
    GOOS=$GOOS GOARCH=$GOARCH go build \
        -ldflags="-s -w -X main.Version=$VERSION" \
        -o "dist/${OUTPUT_NAME}" \
        ./cmd
    
    echo "     ✓ dist/${OUTPUT_NAME}"
done

echo ""
echo "✅ All builds completed successfully!"
echo ""
echo "📂 Build artifacts:"
ls -lh dist/
echo ""
echo "🎉 Release build complete!"
echo ""
echo "To run on this platform:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    ARCH=$(uname -m)
    if [ "$ARCH" = "arm64" ]; then
        echo "  ./dist/weblogview-darwin-arm64"
    else
        echo "  ./dist/weblogview-darwin-amd64"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "  ./dist/weblogview-linux-amd64"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "  .\\dist\\weblogview-windows-amd64.exe"
fi
