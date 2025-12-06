# WebLogView

A cross-platform, web-based log viewer with real-time file monitoring and Kubernetes pod log streaming.

## Features

- 🔄 Real-time log file monitoring
- ☸️ **Kubernetes pod log streaming** (connect directly to pods)
- 🌐 **Multi-cluster support** (switch between Kubernetes contexts)
- 🎯 **Smart namespace & pod discovery** (autocomplete with live filtering)
- 🎨 ANSI color rendering (terminal colors displayed properly)
- 🔍 Regex filtering (include/exclude patterns)
- 📑 Tabbed interface for multiple log sources
- 📊 Dual-pane layout (all lines + filtered lines)
- 🖱️ Click-to-highlight line navigation
- ⚙️ Persistent settings with recent namespaces
- 🌐 Web-based UI (works on any platform)
- 📦 Single executable (no dependencies)

## Quick Start

### Download Pre-built Binary

Download the latest release for your platform from the [Releases](../../releases) page.

### Run

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

The application will automatically open your browser to `http://localhost:8080`.

## Usage

### Viewing Log Files

1. Drag and drop a log file onto the interface, or
2. Click "Choose File" and enter the file path
3. Logs will stream in real-time as the file is updated

### Kubernetes Pod Logs

1. Click the "Kubernetes" option on the landing page
2. Select your cluster context (switches between multiple clusters)
3. Enter or select a namespace (autocomplete with validation):
   - ✓ Green checkmark: namespace exists with pods
   - ⚠ Orange warning: namespace exists but no pods running
   - ✕ Red X: namespace not found
4. Select a pod from the autocomplete dropdown (live filtering)
5. Optionally select a specific container (for multi-container pods)
6. Click "Connect" to start streaming logs

**Kubernetes Features:**
- Recent namespaces are saved and suggested
- All namespaces are available via dropdown with live filtering
- Pod discovery with autocomplete search
- Container selection for multi-container pods
- Context switching for multi-cluster environments

### Command Line Options
```bash
-port int       Port to run the server on (default 8080)
-host string    Host to bind the server to (default "localhost")
-no-browser     Don't automatically open browser
```

## Prerequisites

### For File Watching
- No additional dependencies required

### For Kubernetes Integration
- `kubectl` configured with access to your clusters
- Valid `~/.kube/config` file with cluster contexts
- Appropriate RBAC permissions to list namespaces, pods, and read logs

## Building from Source

### Prerequisites
- Go 1.21 or later
- Node.js 18 or later
- npm

### Quick Build

```bash
make release
```

This will create production-ready executables in the `dist/` directory for all platforms.

### Development Build

```bash
# Install dependencies
go mod download
cd web && npm install && cd ..

# Run backend
go run ./cmd -no-browser

# In another terminal, run frontend dev server
cd web && npm run dev
```

The frontend dev server runs on `http://localhost:3000` and proxies to the backend on `http://localhost:8080`.

## Project Structure

```
WebLogView/
├── cmd/
│   └── main.go                 # Application entry point
├── internal/
│   ├── config/                 # Configuration management
│   ├── server/                 # HTTP server and API
│   │   └── static/             # Embedded frontend (generated)
│   ├── settings/               # Persistent settings
│   ├── websocket/              # WebSocket hub and client
│   └── watcher/                # File watching and K8s log streaming
│       ├── watcher.go          # File watcher
│       ├── k8s_watcher.go      # Kubernetes pod log streaming
│       ├── k8s_pods.go         # Pod discovery
│       ├── k8s_contexts.go     # Context management
│       └── k8s_namespaces.go   # Namespace listing
├── web/                        # Frontend Preact application
│   ├── src/
│   │   ├── components/
│   │   │   ├── K8sConnector.jsx    # Kubernetes connection UI
│   │   │   ├── DropZone.jsx        # File/K8s source selector
│   │   │   └── ...
│   │   ├── hooks/
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── scripts/
│   └── build-release.sh        # Release build script
├── go.mod
├── Makefile
├── DESIGN.md
└── README.md
```

## Settings

Settings are stored in `~/.weblogview/settings.json` and persist across sessions:

- **Initial Window Size**: Number of lines to load initially (default: 1000)
- **ANSI Rendering**: Toggle colored log display per pane (default: enabled)
- **Recent Files**: Last 10 opened log files
- **Recent Namespaces**: Last 10 used Kubernetes namespaces

Access settings via the ⚙️ button in the control bar.

## API Endpoints

### File Operations
- `GET /api/recent-files` - Get recently opened files
- `WS /ws` - WebSocket for log streaming

### Kubernetes Operations
- `GET /api/k8s/contexts` - List available Kubernetes contexts
- `POST /api/k8s/switch-context` - Switch active context
- `GET /api/k8s/namespaces` - List all namespaces in current context
- `GET /api/k8s/pods?namespace=X` - List pods in namespace
- `GET /api/k8s/containers?namespace=X&pod=Y` - List containers in pod
- `GET /api/recent-namespaces` - Get recently used namespaces
- `WS /ws` - WebSocket for pod log streaming (type: "open-k8s")

## Architecture

See [DESIGN.md](DESIGN.md) for detailed architecture and design documentation.

## License

MIT
