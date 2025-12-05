# WebLogView Release Build

This directory contains build scripts for creating production-ready releases.

## Usage

### Quick Release Build

Run the release script from the project root:

```bash
./scripts/build-release.sh
```

Or using Make:

```bash
make release
```

This will:
1. Build the frontend (Vite production build)
2. Embed the frontend into the Go binary
3. Build executables for all platforms:
   - Linux (amd64, arm64)
   - macOS (amd64, arm64)
   - Windows (amd64)

### Output

Built executables will be in the `dist/` directory:
- `weblogview-linux-amd64`
- `weblogview-linux-arm64`
- `weblogview-darwin-amd64`
- `weblogview-darwin-arm64`
- `weblogview-windows-amd64.exe`

### Version Tagging

Set a custom version:

```bash
VERSION=v1.0.0 ./scripts/build-release.sh
```

Or use git tags:

```bash
git tag v1.0.0
./scripts/build-release.sh
```

## Distribution

The built binaries are standalone executables with the frontend embedded. No additional files needed!

Simply copy the appropriate binary for your platform and run it:

```bash
# macOS (Apple Silicon)
./weblogview-darwin-arm64

# macOS (Intel)
./weblogview-darwin-amd64

# Linux
./weblogview-linux-amd64

# Windows
weblogview-windows-amd64.exe
```

The server will start on http://localhost:8080 and automatically open your browser.
