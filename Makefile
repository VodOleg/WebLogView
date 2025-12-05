.PHONY: build run clean test install dev

# Build the application
build:
	go build -o weblogview.exe ./cmd/weblogview

# Build for all platforms
build-all:
	GOOS=windows GOARCH=amd64 go build -o dist/weblogview-windows-amd64.exe ./cmd/weblogview
	GOOS=darwin GOARCH=amd64 go build -o dist/weblogview-darwin-amd64 ./cmd/weblogview
	GOOS=darwin GOARCH=arm64 go build -o dist/weblogview-darwin-arm64 ./cmd/weblogview
	GOOS=linux GOARCH=amd64 go build -o dist/weblogview-linux-amd64 ./cmd/weblogview

# Run the application
run:
	go run ./cmd/weblogview

# Run in development mode (with auto-reload would require additional tools)
dev:
	go run ./cmd/weblogview

# Install dependencies
install:
	go mod download

# Run tests
test:
	go test -v ./...

# Clean build artifacts
clean:
	rm -f weblogview weblogview.exe
	rm -rf dist/

# Format code
fmt:
	go fmt ./...

# Run linter
lint:
	golangci-lint run

# Tidy dependencies
tidy:
	go mod tidy
