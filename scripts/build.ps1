# Build script for Windows
param(
    [string]$Target = "build"
)

$ErrorActionPreference = "Stop"

function BuildFrontend {
    Write-Host ""
    Write-Host "🎨 Building frontend (Vite production build)..." -ForegroundColor Cyan
    
    if (-not (Test-Path "web/package.json")) {
        Write-Host "❌ Frontend not found (web/package.json missing)" -ForegroundColor Red
        exit 1
    }
    
    Push-Location web
    try {
        npm install
        npm run build
        Write-Host "✅ Frontend built successfully!" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

function Build {
    Write-Host "Building WebLogView..." -ForegroundColor Green
    BuildFrontend
    go build -o weblogview.exe ./cmd
    Write-Host "✓ Build complete: weblogview.exe" -ForegroundColor Green
}

function Release {
    Write-Host "🚀 Building WebLogView Release..." -ForegroundColor Green
    Write-Host ""
    
    # Get version from git tag or use default
    try {
        $Version = git describe --tags --always --dirty 2>$null
    } catch {
        $Version = "dev"
    }
    
    Write-Host "📌 Version: $Version" -ForegroundColor Cyan
    Write-Host ""
    
    # Clean previous builds
    Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
    Remove-Item -Recurse -ErrorAction SilentlyContinue dist
    Remove-Item -Recurse -ErrorAction SilentlyContinue web/dist
    New-Item -ItemType Directory -Force -Path dist | Out-Null
    Write-Host ""
    
    # Step 1: Build Frontend
    BuildFrontend
    Write-Host ""
    
    # Step 2: Build Backend for all platforms
    Write-Host "🔨 Building backend for all platforms..." -ForegroundColor Cyan
    Write-Host ""
    
    $platforms = @(
        @{OS="linux";   Arch="amd64"},
        @{OS="linux";   Arch="arm64"},
        @{OS="darwin";  Arch="amd64"},
        @{OS="darwin";  Arch="arm64"},
        @{OS="windows"; Arch="amd64"}
    )
    
    foreach ($platform in $platforms) {
        $goos = $platform.OS
        $goarch = $platform.Arch
        
        $outputName = "weblogview-$goos-$goarch"
        if ($goos -eq "windows") {
            $outputName += ".exe"
        }
        
        Write-Host "  📦 Building for $goos/$goarch..." -ForegroundColor White
        
        $env:GOOS = $goos
        $env:GOARCH = $goarch
        
        go build -ldflags="-s -w -X main.Version=$Version" -o "dist/$outputName" ./cmd
        
        Write-Host "     ✓ dist/$outputName" -ForegroundColor Green
        
        Remove-Item Env:\GOOS
        Remove-Item Env:\GOARCH
    }
    
    Write-Host ""
    Write-Host "✅ All builds completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📂 Build artifacts:" -ForegroundColor Cyan
    Get-ChildItem dist | Format-Table Name, Length -AutoSize
    Write-Host ""
    Write-Host "🎉 Release build complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To run on this platform:" -ForegroundColor Yellow
    Write-Host "  .\dist\weblogview-windows-amd64.exe" -ForegroundColor White
    Write-Host ""
}

function BuildAll {
    # Alias for Release
    Release
}

function Run {
    Write-Host "Running WebLogView..." -ForegroundColor Green
    go run ./cmd
}

function Clean {
    Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
    Remove-Item -ErrorAction SilentlyContinue weblogview.exe
    Remove-Item -Recurse -ErrorAction SilentlyContinue dist
    Write-Host "✓ Clean complete" -ForegroundColor Green
}

function Test {
    Write-Host "Running tests..." -ForegroundColor Green
    go test -v ./...
}

function Install {
    Write-Host "Installing dependencies..." -ForegroundColor Green
    go mod download
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
}

# Execute the requested target
switch ($Target.ToLower()) {
    "build" { Build }
    "release" { Release }
    "build-all" { BuildAll }
    "run" { Run }
    "clean" { Clean }
    "test" { Test }
    "install" { Install }
    default {
        Write-Host "Unknown target: $Target" -ForegroundColor Red
        Write-Host ""
        Write-Host "Available targets:" -ForegroundColor Yellow
        Write-Host "  build      - Build the application"
        Write-Host "  release    - Build optimized release version"
        Write-Host "  build-all  - Build for all platforms"
        Write-Host "  run        - Run the application"
        Write-Host "  clean      - Clean build artifacts"
        Write-Host "  test       - Run tests"
        Write-Host "  install    - Install dependencies"
        exit 1
    }
}
