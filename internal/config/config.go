package config

import "time"

// Config holds application configuration
type Config struct {
	Host               string
	Port               int
	MaxLinesMemory     int
	TailLines          int
	ChunkSize          int
	MaxFileSize        int64
	BufferSize         int
	MaxConcurrentFiles int
	PollingInterval    time.Duration // Fallback polling interval for file watching
}

// New creates a new configuration with defaults
func New(host string, port int) *Config {
	return &Config{
		Host:               host,
		Port:               port,
		MaxLinesMemory:     100000,           // Max lines to keep in memory
		TailLines:          1000,             // Initial lines to load
		ChunkSize:          5000,             // Lines per chunk
		MaxFileSize:        1 << 30,          // 1GB max file size
		BufferSize:         65536,            // 64KB file read buffer
		MaxConcurrentFiles: 10,               // Max concurrent files
		PollingInterval:    500 * time.Millisecond, // Fallback polling interval
	}
}
