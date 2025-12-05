# WebLogView

A cross-platform, web-based log viewer with real-time file monitoring.

## Features

- 🔄 Real-time log file monitoring
- 🎨 ANSI color rendering (terminal colors displayed properly)
- 🔍 Regex filtering (include/exclude patterns)
- 📑 Tabbed interface for multiple log files
- 📊 Dual-pane layout (all lines + filtered lines)
- 🖱️ Click-to-highlight line navigation
- ⚙️ Persistent settings
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

### Command Line Options
```bash
-port int       Port to run the server on (default 8080)
-host string    Host to bind the server to (default "localhost")
-no-browser     Don't automatically open browser
```

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
│   └── watcher/                # File watching and reading
├── web/                        # Frontend Preact application
│   ├── src/
│   │   ├── components/
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

Access settings via the ⚙️ button in the control bar.

## Architecture

See [DESIGN.md](DESIGN.md) for detailed architecture and design documentation.

## License

MIT
