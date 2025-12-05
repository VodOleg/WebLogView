# WebLogView - High Level Design

## Overview
A cross-platform, web-based log viewer with real-time file monitoring, designed as a self-hosted alternative to BareTail that works on Windows, macOS, and Linux.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser (Client)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  UI Layer (Preact + Virtual Scrolling)                 │ │
│  │  - Log display with virtual scrolling                  │ │
│  │  - Filter input (regex support)                        │ │
│  │  - File selection controls                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ▲                                 │
│                            │ WebSocket + HTTP                │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                            ▼                                 │
│                   Go Backend Server                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  HTTP Server (Static files + API endpoints)            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  WebSocket Handler (Real-time log streaming)           │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  File Watcher (fsnotify)                               │ │
│  │  - Monitor file changes                                │ │
│  │  - Detect new lines                                    │ │
│  │  - Handle file rotation                                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Log Reader                                            │ │
│  │  - Read file content efficiently                       │ │
│  │  - Handle large files (streaming)                      │ │
│  │  - Support seeking/pagination                          │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   Log Files    │
                    │  (File System) │
                    └────────────────┘
```

## Data Flow

### Initial Load
1. User starts application (double-click binary)
2. Go server starts on localhost:8080
3. Browser opens automatically
4. User selects log file via UI
5. Frontend sends file path via WebSocket
6. Backend reads initial content (last N lines or full file)
7. Backend sends content to frontend in chunks
8. Frontend renders using virtual scrolling

### Real-time Monitoring
1. Backend watches file for changes (fsnotify)
2. New lines detected
3. Backend reads new content
4. Backend streams to connected clients via WebSocket
5. Frontend appends to virtual list
6. Auto-scroll if enabled

### Filtering
1. User types filter pattern (regex) in include/exclude inputs
2. Preact state updates trigger re-render
3. useMemo recomputes filtered log lines
4. Virtual scroller re-renders with filtered results
5. (Optional: Backend-side filtering for very large files)

## Key Technical Decisions

### Backend (Go)

**Core Libraries:**
- `net/http` - HTTP server and static file serving
- `gorilla/websocket` - WebSocket communication
- `fsnotify/fsnotify` - File system monitoring
- `embed` - Embed frontend files in binary

**Architecture Patterns:**
- Goroutine per file watcher
- Channel-based communication between watcher and WebSocket handler
- Buffered readers for efficient file I/O
- Graceful shutdown handling

**Performance Considerations:**
- Stream large files instead of loading entirely
- Configurable line buffer limits
- Efficient tail reading (seek from end)
- Handle log rotation gracefully

### Frontend (Preact)

**Core Technologies:**
- Preact (~3KB) - Lightweight React alternative
- Preact Hooks - State management (useState, useEffect, useMemo)
- preact/compat - 100% React API compatibility
- react-window or react-virtualized - Virtual scrolling
- WebSocket API - Real-time communication

**State Management:**
- Component state for UI (filters, auto-scroll, connection status)
- Ring buffer for log lines (configurable max lines in memory)
- Memoized filtering with useMemo
- Reactive updates on state changes

**Data Management:**
- Incremental filtering with include/exclude regex
- Lazy loading for historical data
- Efficient re-renders with Preact's diffing

**Performance Optimizations:**
- Virtual scrolling for millions of lines
- Debounced filter input
- Memoized filter computations
- Code splitting for production build
- Web Workers for heavy filtering (optional)

## API Design

### HTTP Endpoints

```
GET  /                          Serve main HTML
GET  /static/*                  Static assets (JS, CSS)
GET  /api/health               Health check
POST /api/browse               Browse file system (optional)
```

### WebSocket Protocol

**Client → Server Messages:**
```json
{
  "type": "open",
  "path": "/path/to/file.log",
  "tail": 1000  // Load last N lines
}

{
  "type": "close"  // Stop watching current file
}

{
  "type": "seek",
  "offset": 50000,  // Line number or byte offset
  "count": 1000
}
```

**Server → Client Messages:**
```json
{
  "type": "initial",
  "lines": ["line1", "line2", ...],
  "totalLines": 150000
}

{
  "type": "append",
  "lines": ["new line 1", "new line 2"]
}

{
  "type": "error",
  "message": "File not found"
}

{
  "type": "metadata",
  "fileSize": 1024000,
  "encoding": "utf-8"
}
```

## File Handling Strategy

### Large File Support
- Stream-based reading (don't load entire file)
- Configurable chunk size (e.g., 10,000 lines)
- Seek support for jumping to specific positions
- Progressive loading (infinite scroll up/down)

### File Rotation Handling
- Detect when file is truncated (size decrease)
- Detect when file is renamed/deleted
- Automatically reload on rotation
- Notify user of file changes

### Multi-File Support (Future)
- Tab-based interface
- One watcher goroutine per file
- One WebSocket connection, multiplexed channels
- Resource limits (max files, max memory)

## Configuration

### Application Settings
```yaml
server:
  port: 8080
  host: localhost
  auto_open_browser: true

log_viewer:
  max_lines_memory: 100000    # Max lines to keep in memory
  tail_lines: 1000            # Initial lines to load
  chunk_size: 5000            # Lines per chunk
  max_file_size: 1073741824   # 1GB max file size
  
performance:
  buffer_size: 65536          # File read buffer
  max_concurrent_files: 10
```

## Project Structure

```
WebLogView/
├── cmd/
│   └── weblogview/
│       └── main.go              # Application entry point
├── internal/
│   ├── server/
│   │   ├── server.go            # HTTP server setup
│   │   └── handlers.go          # HTTP handlers
│   ├── websocket/
│   │   ├── hub.go               # WebSocket connection manager
│   │   └── client.go            # Client connection handler
│   ├── watcher/
│   │   ├── watcher.go           # File watching logic
│   │   └── reader.go            # File reading utilities
│   └── config/
│       └── config.go            # Configuration management
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx              # Main application component
│   │   │   ├── LogViewer.jsx        # Log display with virtual scrolling
│   │   │   ├── FilterBar.jsx        # Include/exclude filter inputs
│   │   │   ├── Toolbar.jsx          # File controls and settings
│   │   │   └── StatusBar.jsx        # Connection status, line count
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js      # WebSocket connection hook
│   │   │   ├── useLogBuffer.js      # Log buffer management
│   │   │   └── useFilteredLogs.js   # Filtering logic
│   │   ├── utils/
│   │   │   └── filters.js           # Regex filtering utilities
│   │   ├── index.html               # HTML entry point
│   │   └── main.jsx                 # Preact app bootstrap
│   ├── public/
│   │   └── styles.css               # Global styles
│   └── package.json                 # Frontend dependencies
├── go.mod
├── go.sum
├── README.md
├── DESIGN.md                    # This file
└── Makefile                     # Build automation
```

## Development Phases

### Phase 1: Core Functionality (MVP)
- [ ] Go server with HTTP + WebSocket
- [ ] File watcher implementation
- [ ] Basic frontend (no virtual scrolling)
- [ ] Open single file
- [ ] Real-time tail functionality
- [ ] Basic filtering (simple text search)

### Phase 2: Performance & UX
- [ ] Virtual scrolling implementation
- [ ] Regex filtering
- [ ] Syntax highlighting (basic)
- [ ] Auto-scroll toggle
- [ ] Line numbers
- [ ] Copy to clipboard

### Phase 3: Advanced Features
- [ ] Large file optimization (streaming)
- [ ] Historical data loading (scroll up)
- [ ] File rotation handling
- [ ] Search/jump to line
- [ ] Bookmarks/highlights
- [ ] Export filtered results

### Phase 4: Polish & Distribution
- [ ] Dark/light theme
- [ ] Keyboard shortcuts
- [ ] Configuration UI
- [ ] Multi-platform builds
- [ ] Installer/package creation
- [ ] Documentation

## Non-Functional Requirements

### Performance Targets
- Handle files up to 1GB
- Support millions of lines in memory
- < 100ms latency for new log lines
- < 16ms frame time for smooth scrolling
- < 50MB memory overhead (excluding log data)

### Compatibility
- Windows 10+
- macOS 10.15+
- Linux (major distributions)
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Reliability
- Graceful handling of file access errors
- Auto-reconnect WebSocket on disconnect
- No crashes on malformed log files
- Proper cleanup on application exit

## Security Considerations

### Local-Only Access
- Bind to localhost only by default
- No authentication (local trust model)
- Optional network binding with warning

### File System Access
- Validate file paths (prevent directory traversal)
- Read-only access to log files
- Configurable allowed directories (optional)

### Input Validation
- Sanitize regex patterns (prevent ReDoS)
- Limit WebSocket message size
- Rate limiting on file operations

## Future Enhancements

### Possible Features
- Multi-tab support (multiple files)
- SSH/remote file support
- Log parsing plugins
- Alert/notification rules
- Statistics dashboard
- Compare two log files
- Session persistence
- Saved filter patterns
- Color coding by log level
- Timestamp parsing and filtering

### Plugin System (Long-term)
- Custom log parsers
- Custom syntax highlighting
- Export formats
- Integration with external tools
