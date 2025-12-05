package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/yourusername/weblogview/internal/config"
	"github.com/yourusername/weblogview/internal/watcher"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 8192
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all connections for now (local only)
		return true
	},
}

// Client represents a WebSocket client connection
type Client struct {
	hub     *Hub
	conn    *websocket.Conn
	send    chan []byte
	watcher *watcher.FileWatcher
	config  *config.Config
}

// Message represents a WebSocket message
type Message struct {
	Type    string   `json:"type"`
	Path    string   `json:"path,omitempty"`
	Tail    int      `json:"tail,omitempty"`
	Lines   []string `json:"lines,omitempty"`
	Message string   `json:"message,omitempty"`
	Error   string   `json:"error,omitempty"`
}

// HandleWebSocket handles WebSocket connection requests
func HandleWebSocket(hub *Hub, cfg *config.Config, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		config: cfg,
	}

	client.hub.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// readPump pumps messages from the WebSocket connection to the hub
func (c *Client) readPump() {
	defer func() {
		if c.watcher != nil {
			c.watcher.Stop()
		}
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Parse message
		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Error parsing message: %v", err)
			c.sendError("Invalid message format")
			continue
		}

		// Handle message based on type
		c.handleMessage(&msg)
	}
}

// writePump pumps messages from the hub to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current WebSocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage processes incoming messages from the client
func (c *Client) handleMessage(msg *Message) {
	switch msg.Type {
	case "open":
		c.handleOpenFile(msg)
	case "close":
		c.handleCloseFile()
	default:
		c.sendError("Unknown message type: " + msg.Type)
	}
}

// handleOpenFile handles file open requests
func (c *Client) handleOpenFile(msg *Message) {
	// Stop existing watcher if any
	if c.watcher != nil {
		c.watcher.Stop()
		c.watcher = nil
	}

	// Determine tail lines (use default if not specified)
	tailLines := msg.Tail
	if tailLines == 0 {
		tailLines = c.config.TailLines
	}

	// Create file watcher
	fw, err := watcher.NewFileWatcher(msg.Path, tailLines, c.config)
	if err != nil {
		c.sendError("Failed to open file: " + err.Error())
		return
	}

	c.watcher = fw

	// Collect initial lines before starting the watcher
	initialLines := []string{}
	initialDone := make(chan struct{})

	// Start collecting initial lines in a goroutine
	go func() {
		for line := range fw.Lines {
			select {
			case <-initialDone:
				// After initial load, send lines as they come
				c.sendNewLines([]string{line})
			default:
				// During initial load, collect lines
				initialLines = append(initialLines, line)
			}
		}
	}()

	// Start watching (this sends initial lines to fw.Lines channel)
	if err := fw.Start(); err != nil {
		c.sendError("Failed to start watching: " + err.Error())
		return
	}

	// Give a moment for initial lines to be collected
	time.Sleep(100 * time.Millisecond)
	close(initialDone)

	// Send initial lines to client
	if len(initialLines) > 0 {
		c.sendInitialLines(initialLines)
	}
}

// handleCloseFile handles file close requests
func (c *Client) handleCloseFile() {
	if c.watcher != nil {
		c.watcher.Stop()
		c.watcher = nil
	}
}

// sendInitialLines sends initial log lines to the client
func (c *Client) sendInitialLines(lines []string) {
	msg := Message{
		Type:  "initial",
		Lines: lines,
	}
	data, _ := json.Marshal(msg)
	c.send <- data
}

// sendNewLines sends new log lines to the client
func (c *Client) sendNewLines(lines []string) {
	msg := Message{
		Type:  "lines",
		Lines: lines,
	}
	data, _ := json.Marshal(msg)
	c.send <- data
}

// sendError sends an error message to the client
func (c *Client) sendError(errMsg string) {
	msg := Message{
		Type:  "error",
		Error: errMsg,
	}
	data, _ := json.Marshal(msg)
	c.send <- data
}
