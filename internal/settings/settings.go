package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// Settings represents application settings
type Settings struct {
	TailLines int `json:"tailLines"` // Number of lines to load initially
	mu        sync.RWMutex
}

var (
	instance *Settings
	once     sync.Once
)

// GetInstance returns the singleton settings instance
func GetInstance() *Settings {
	once.Do(func() {
		instance = &Settings{
			TailLines: 1000, // Default
		}
		instance.Load()
	})
	return instance
}

// Load loads settings from file
func (s *Settings) Load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	settingsPath := getSettingsPath()
	data, err := os.ReadFile(settingsPath)
	if err != nil {
		if os.IsNotExist(err) {
			// File doesn't exist, use defaults
			return nil
		}
		return err
	}

	return json.Unmarshal(data, s)
}

// Save saves settings to file
func (s *Settings) Save() error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	settingsPath := getSettingsPath()

	// Ensure directory exists
	dir := filepath.Dir(settingsPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(settingsPath, data, 0644)
}

// GetTailLines returns the tail lines setting
func (s *Settings) GetTailLines() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.TailLines
}

// SetTailLines sets the tail lines setting
func (s *Settings) SetTailLines(lines int) {
	s.mu.Lock()
	s.TailLines = lines
	s.mu.Unlock()
}

// getSettingsPath returns the path to the settings file
func getSettingsPath() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	return filepath.Join(homeDir, ".weblogview", "settings.json")
}
