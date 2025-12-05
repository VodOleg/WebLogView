package server

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"

	"github.com/yourusername/weblogview/internal/config"
	"github.com/yourusername/weblogview/internal/settings"
	"github.com/yourusername/weblogview/internal/websocket"
)

//go:embed static
var staticFiles embed.FS

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
	// Serve embedded static files
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		http.Error(w, "Failed to load static files", http.StatusInternalServerError)
		return
	}

	// Try to serve the requested file, default to index.html for SPA
	requestPath := r.URL.Path
	if requestPath == "/" {
		requestPath = "/index.html"
	}

	// Check if file exists
	if _, err := staticFS.Open(requestPath[1:]); err != nil {
		// File not found, serve index.html for SPA routing
		requestPath = "/index.html"
	}

	http.FileServer(http.FS(staticFS)).ServeHTTP(w, r)
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
			TailLines            int  `json:"tailLines"`
			RenderAnsiTopPane    bool `json:"renderAnsiTopPane"`
			RenderAnsiBottomPane bool `json:"renderAnsiBottomPane"`
		}
		response := SettingsResponse{
			TailLines:            appSettings.GetTailLines(),
			RenderAnsiTopPane:    appSettings.GetRenderAnsiTopPane(),
			RenderAnsiBottomPane: appSettings.GetRenderAnsiBottomPane(),
		}
		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

	case "POST":
		// Update settings
		var update struct {
			TailLines            int   `json:"tailLines"`
			RenderAnsiTopPane    *bool `json:"renderAnsiTopPane"`
			RenderAnsiBottomPane *bool `json:"renderAnsiBottomPane"`
		}
		if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if update.TailLines > 0 {
			appSettings.SetTailLines(update.TailLines)
		}
		if update.RenderAnsiTopPane != nil {
			appSettings.SetRenderAnsiTopPane(*update.RenderAnsiTopPane)
		}
		if update.RenderAnsiBottomPane != nil {
			appSettings.SetRenderAnsiBottomPane(*update.RenderAnsiBottomPane)
		}

		if err := appSettings.Save(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write([]byte(`{"status":"ok"}`))

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
