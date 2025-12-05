package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/yourusername/weblogview/internal/config"
	"github.com/yourusername/weblogview/internal/settings"
	"github.com/yourusername/weblogview/internal/websocket"
)

// Server represents the HTTP server
type Server struct {
	config *config.Config
	hub    *websocket.Hub
}

// New creates a new server instance
func New(cfg *config.Config) *Server {
	hub := websocket.NewHub()
	return &Server{
		config: cfg,
		hub:    hub,
	}
}

// Start starts the HTTP server
func (s *Server) Start() error {
	// Start the WebSocket hub
	go s.hub.Run()

	// Register HTTP handlers
	http.HandleFunc("/", s.handleIndex)
	http.HandleFunc("/api/health", s.handleHealth)
	http.HandleFunc("/api/settings", s.handleSettings)
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.HandleWebSocket(s.hub, s.config, w, r)
	})

	// Start server
	addr := fmt.Sprintf("%s:%d", s.config.Host, s.config.Port)
	return http.ListenAndServe(addr, nil)
}

// handleIndex serves the main HTML page
func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
	// For now, serve a simple placeholder
	// We'll replace this with embedded files later
	html := `<!DOCTYPE html>
<html>
<head>
    <title>WebLogView</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>WebLogView</h1>
    <p>Frontend coming soon...</p>
    <p>WebSocket endpoint: <code>ws://` + s.config.Host + `:` + fmt.Sprintf("%d", s.config.Port) + `/ws</code></p>
</body>
</html>`
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(html))
}

// handleHealth handles health check requests
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok"}`))
}

// handleSettings handles settings GET/POST requests
func (s *Server) handleSettings(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	appSettings := settings.GetInstance()

	switch r.Method {
	case "GET":
		// Return current settings
		type SettingsResponse struct {
			TailLines int `json:"tailLines"`
		}
		response := SettingsResponse{
			TailLines: appSettings.GetTailLines(),
		}
		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

	case "POST":
		// Update settings
		var update struct {
			TailLines int `json:"tailLines"`
		}
		if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if update.TailLines > 0 {
			appSettings.SetTailLines(update.TailLines)
			if err := appSettings.Save(); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		w.Write([]byte(`{"status":"ok"}`))

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
