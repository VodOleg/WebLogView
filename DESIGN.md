# WebLogView - High Level Design

## Overview
A cross-platform, web-based log viewer with real-time file monitoring and Kubernetes pod log streaming that works on Windows, macOS, and Linux.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser (Client)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  UI Layer (Preact + Virtual Scrolling)                 │ │
│  │  - Tabbed interface for multiple sources               │ │
│  │  - Dual-pane layout (all lines + filtered)             │ │
│  │  - File selection OR Kubernetes connector              │ │
│  │  - K8s: Context/Namespace/Pod/Container dropdowns      │ │
│  │  - Filter input (regex support)                        │ │
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
│  │  - /api/k8s/contexts, namespaces, pods, containers     │ │
│  │  - /api/recent-files, recent-namespaces                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  WebSocket Handler (Real-time log streaming)           │ │
│  │  - File watcher or K8s watcher per client              │ │
│  │  - Message types: open, open-k8s, lines, error         │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  File Watcher (fsnotify)                               │ │
│  │  - Monitor file changes                                │ │
│  │  - Detect new lines                                    │ │
│  │  - Handle file rotation                                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Kubernetes Watcher (client-go)                        │ │
│  │  - Stream pod logs via K8s API                         │ │
│  │  - List contexts, namespaces, pods, containers         │ │
│  │  - Context switching support                           │ │
│  │  - Namespace validation                                │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
            ┌───────────────┐  ┌──────────────┐
            │   Log Files   │  │ Kubernetes   │
            │ (File System) │  │   Clusters   │
            └───────────────┘  └──────────────┘
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

### Real-time Monitoring (Files)
1. Backend watches file for changes (fsnotify)
2. New lines detected
3. Backend reads new content
4. Backend streams to connected clients via WebSocket
5. Frontend appends to virtual list
6. Auto-scroll if enabled

### Real-time Monitoring (Kubernetes)
1. User selects context, namespace, pod, container via UI
2. Frontend sends "open-k8s" message via WebSocket
3. Backend creates Kubernetes client using client-go
4. Backend validates namespace existence
5. Backend starts streaming pod logs via K8s API
6. Backend forwards log lines to WebSocket client
7. Frontend appends to virtual list
8. Auto-scroll if enabled
9. Namespace saved to recent history

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
- `k8s.io/client-go` - Kubernetes API client
- `k8s.io/api` - Kubernetes API types
- `embed` - Embed frontend files in binary

**Kubernetes Integration:**
- Reads `~/.kube/config` for cluster configuration
- Lists and switches between contexts (clusters)
- Discovers namespaces, pods, and containers
- Streams logs using PodLogs() API with Follow=true
- Validates namespace existence before listing pods
- Graceful handling of context switching and disconnections

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
GET  /                              Serve main HTML
GET  /static/*                      Static assets (JS, CSS)
GET  /api/health                    Health check
GET  /api/settings                  Get/update application settings
GET  /api/recent-files              Get recently opened files
GET  /api/recent-namespaces         Get recently used K8s namespaces
GET  /api/k8s/contexts              List available K8s contexts
POST /api/k8s/switch-context        Switch active K8s context
GET  /api/k8s/namespaces            List namespaces in current context
GET  /api/k8s/pods?namespace=X      List pods in namespace
GET  /api/k8s/containers?namespace=X&pod=Y  List containers in pod
```

### WebSocket Protocol

**Client → Server Messages:**
```json
{
  "type": "open",
  "path": "/path/to/file.log",
  "tail": 1000  // Load last N lines (optional, uses settings default)
}

{
  "type": "open-k8s",
  "namespace": "production",
  "podName": "my-app-pod-abc123",
  "containerName": "app",  // optional
  "tail": 1000  // Load last N lines (optional, uses settings default)
}

{
  "type": "close"  // Stop watching current source
}
```

**Server → Client Messages:**
```json
{
  "type": "initial",
  "lines": ["line1", "line2", ...]
}

{
  "type": "lines",
  "lines": ["new line 1", "new line 2"]
}

{
  "type": "error",
  "message": "File not found"
}

{
  "type": "clear"
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
│   │   └── handlers.go          # HTTP and API handlers
│   ├── websocket/
│   │   ├── hub.go               # WebSocket connection manager
│   │   └── client.go            # Client connection handler
│   ├── watcher/
│   │   ├── watcher.go           # File watching logic
│   │   ├── k8s_watcher.go       # Kubernetes log streaming
│   │   ├── k8s_contexts.go      # K8s context management
│   │   ├── k8s_namespaces.go    # Namespace listing
│   │   └── k8s_pods.go          # Pod and container discovery
│   ├── settings/
│   │   └── settings.go          # Persistent settings (files, namespaces)
│   └── config/
│       └── config.go            # Configuration management
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx              # Main application (tabs)
│   │   │   ├── LogViewerTab.jsx     # Individual tab component
│   │   │   ├── LogViewer.jsx        # Log display with virtual scrolling
│   │   │   ├── ControlBar.jsx       # Include/exclude filter inputs
│   │   │   ├── DropZone.jsx         # File vs K8s source selector
│   │   │   ├── K8sConnector.jsx     # K8s connection form with autocomplete
│   │   │   ├── ResizablePanes.jsx   # Dual-pane layout with resize
│   │   │   └── SettingsModal.jsx    # Application settings
│   │   ├── hooks/
│   │   │   └── useWebSocket.js      # WebSocket connection hook
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
- [x] Go server with HTTP + WebSocket
- [x] File watcher implementation
- [x] Basic frontend with virtual scrolling
- [x] Open single file
- [x] Real-time tail functionality
- [x] Regex filtering (include/exclude)
- [x] Tabbed interface
- [x] Dual-pane layout
- [x] ANSI color rendering
- [x] Persistent settings

### Phase 2: Kubernetes Integration
- [x] Kubernetes client-go integration
- [x] Pod log streaming via K8s API
- [x] Context listing and switching
- [x] Namespace discovery and validation
- [x] Pod discovery with autocomplete
- [x] Container selection for multi-container pods
- [x] Recent namespaces persistence
- [x] Smart UI indicators (namespace validation)
- [x] Side-by-side source selection (File vs K8s)

### Phase 3: Advanced Features
- [ ] Large file optimization (streaming)
- [ ] Historical data loading (scroll up)
- [ ] File rotation handling
- [ ] Search/jump to line
- [ ] Bookmarks/highlights
- [ ] Export filtered results
- [ ] Multi-pod log aggregation

### Phase 4: Polish & Distribution
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts
- [ ] Multi-platform builds
- [ ] Installer/package creation
- [ ] Comprehensive documentation

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
- Multi-pod log aggregation (stream from multiple pods)
- Log level filtering (parse structured logs)
- SSH/remote file support
- Log parsing plugins
- Alert/notification rules
- Statistics dashboard
- Compare two log files/pods
- Session persistence
- Saved filter patterns
- Color coding by log level
- Timestamp parsing and time-range filtering
- Label-based pod selection
- Recent pods history (like recent files/namespaces)
- Pod status indicators in UI

### Plugin System (Long-term)
- Custom log parsers
- Custom syntax highlighting
- Export formats
- Integration with external tools
