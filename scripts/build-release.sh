#!/bin/bash

# WebLogView Release Build Script
# Builds production-ready executables for all platforms

set -e  # Exit on error

echo "🚀 Building WebLogView Release..."
echo ""

# Get version from VERSION file or use git tag as fallback
if [ -f "VERSION" ]; then
    VERSION="v$(cat VERSION)"
else
    VERSION=${VERSION:-$(git describe --tags --always 2>/dev/null || echo "dev")}
fi
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

# Step 3: Create distribution archives
echo "📦 Creating distribution archives..."
echo ""

# Create archives directory
mkdir -p dist/archives

# Package Linux builds (tar.gz preserves permissions)
for arch in amd64 arm64; do
    BINARY="weblogview-linux-${arch}"
    ARCHIVE="dist/archives/${BINARY}-${VERSION}.tar.gz"
    echo "  📦 Creating ${BINARY}-${VERSION}.tar.gz..."
    tar -czf "$ARCHIVE" -C dist "$BINARY"
    echo "     ✓ $ARCHIVE"
done

# Package macOS builds (tar.gz preserves permissions)
for arch in amd64 arm64; do
    BINARY="weblogview-darwin-${arch}"
    ARCHIVE="dist/archives/${BINARY}-${VERSION}.tar.gz"
    echo "  📦 Creating ${BINARY}-${VERSION}.tar.gz..."
    tar -czf "$ARCHIVE" -C dist "$BINARY"
    echo "     ✓ $ARCHIVE"
done

# Package Windows builds (zip)
for arch in amd64; do
    BINARY="weblogview-windows-${arch}.exe"
    ARCHIVE="weblogview-windows-${arch}-${VERSION}.zip"
    echo "  📦 Creating ${ARCHIVE}..."
    (cd dist && zip -q "../dist/archives/${ARCHIVE}" "$BINARY")
    echo "     ✓ dist/archives/${ARCHIVE}"
done

echo ""
echo "📂 Build artifacts:"
ls -lh dist/
echo ""
echo "📦 Distribution archives:"
ls -lh dist/archives/
echo ""
echo "🎉 Release build complete!"
echo ""
echo "To run on this platform:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    ARCH=$(uname -m)
    if [ "$ARCH" = "arm64" ]; then
        echo "  tar -xzf dist/archives/weblogview-darwin-arm64-${VERSION}.tar.gz"
        echo "  ./weblogview-darwin-arm64"
    else
        echo "  tar -xzf dist/archives/weblogview-darwin-amd64-${VERSION}.tar.gz"
        echo "  ./weblogview-darwin-amd64"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "  tar -xzf dist/archives/weblogview-linux-amd64-${VERSION}.tar.gz"
    echo "  ./weblogview-linux-amd64"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "  unzip dist/archives/weblogview-windows-amd64-${VERSION}.zip"
    echo "  .\\weblogview-windows-amd64.exe"
fi
