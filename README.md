# WebLogView

A cross-platform, web-based log viewer with real-time file monitoring.

## Quick Start

### Build
```bash
go build -o weblogview.exe ./cmd
```

### Run
```bash
./weblogview.exe
```

The application will automatically open your browser to `http://localhost:8080`.

### Command Line Options
```bash
-port int       Port to run the server on (default 8080)
-host string    Host to bind the server to (default "localhost")
-no-browser     Don't automatically open browser
```

## Development

### Prerequisites
- Go 1.21 or later

### Install Dependencies
```bash
go mod download
```

### Run in Development Mode
```bash
go run ./cmd
```

## Architecture

See [DESIGN.md](DESIGN.md) for detailed architecture and design documentation.

## Project Structure

```
WebLogView/
├── cmd/
│   └── main.go             # Application entry point
├── internal/
│   ├── config/            # Configuration management
│   ├── server/            # HTTP server
│   ├── websocket/         # WebSocket hub and client
│   └── watcher/           # File watching and reading
├── web/                   # Frontend (coming soon)
├── go.mod
├── go.sum
├── DESIGN.md
└── README.md
```

## License

MIT
