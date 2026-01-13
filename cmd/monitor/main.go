package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/mini-btop/internal/metrics"
)

const (
	defaultPort       = "8080"
	updateInterval    = 250 * time.Millisecond
	heartbeatInterval = 30 * time.Second
	staticDir         = "./static"
)

// Hub manages all SSE clients and broadcasts metrics
type Hub struct {
	clients    map[chan []byte]struct{}
	register   chan chan []byte
	unregister chan chan []byte
	broadcast  chan []byte
	mu         sync.RWMutex
}

func newHub() *Hub {
	return &Hub{
		clients:    make(map[chan []byte]struct{}),
		register:   make(chan chan []byte),
		unregister: make(chan chan []byte),
		broadcast:  make(chan []byte, 1),
	}
}

func (h *Hub) run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			h.mu.Lock()
			for client := range h.clients {
				close(client)
				delete(h.clients, client)
			}
			h.mu.Unlock()
			return

		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = struct{}{}
			h.mu.Unlock()
			log.Printf("Client connected (total: %d)", len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				close(client)
				delete(h.clients, client)
			}
			h.mu.Unlock()
			log.Printf("Client disconnected (total: %d)", len(h.clients))

		case data := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client <- data:
				default:
					// Client buffer full, skip this update
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) clientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	collector := metrics.NewCollector()
	hub := newHub()

	// Context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Run hub
	go hub.run(ctx)

	// Run collector - single goroutine collects and broadcasts
	go runCollector(ctx, collector, hub)

	// Serve static files
	http.Handle("/", http.FileServer(http.Dir(staticDir)))

	// SSE endpoint
	http.HandleFunc("/api/stream", func(w http.ResponseWriter, r *http.Request) {
		handleSSE(w, r, hub)
	})

	addr := ":" + port
	server := &http.Server{
		Addr: addr,
	}

	// Channel to listen for interrupt signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Start server in a goroutine
	go func() {
		log.Printf("Starting mini-btop server on %s", addr)
		log.Printf("Open http://localhost:%s in your browser", port)
		log.Printf("Press Ctrl+C to stop")

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	<-stop

	log.Println("\nShutting down gracefully...")
	cancel() // Stop collector and hub

	// Create shutdown context with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	// Attempt graceful shutdown
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server stopped")
}

// runCollector runs a single collector that broadcasts to all clients
func runCollector(ctx context.Context, collector *metrics.Collector, hub *Hub) {
	ticker := time.NewTicker(updateInterval)
	heartbeat := time.NewTicker(heartbeatInterval)
	defer ticker.Stop()
	defer heartbeat.Stop()

	// Cache for JSON data
	var cachedData []byte

	for {
		select {
		case <-ctx.Done():
			return

		case <-ticker.C:
			// Skip if no clients
			if hub.clientCount() == 0 {
				continue
			}

			m, err := collector.Collect()
			if err != nil {
				log.Printf("Error collecting metrics: %v", err)
				continue
			}

			data, err := json.Marshal(m)
			if err != nil {
				log.Printf("Error marshaling metrics: %v", err)
				continue
			}

			// Format SSE message
			cachedData = append([]byte("data: "), data...)
			cachedData = append(cachedData, '\n', '\n')

			// Broadcast to all clients
			select {
			case hub.broadcast <- cachedData:
			default:
				// Channel full, skip
			}

		case <-heartbeat.C:
			// Send heartbeat ping
			if hub.clientCount() > 0 {
				select {
				case hub.broadcast <- []byte(": ping\n\n"):
				default:
				}
			}
		}
	}
}

func handleSSE(w http.ResponseWriter, r *http.Request, hub *Hub) {
	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("X-Accel-Buffering", "no") // Disable nginx buffering

	// Check if response writer supports flushing
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Create client channel with buffer
	client := make(chan []byte, 8)

	// Register client
	hub.register <- client

	// Ensure cleanup on disconnect
	defer func() {
		hub.unregister <- client
	}()

	// Send initial connection message
	fmt.Fprintf(w, "event: connected\ndata: {\"message\":\"Connected to mini-btop\"}\n\n")
	flusher.Flush()

	// Stream data to client
	for {
		select {
		case <-r.Context().Done():
			return

		case data, ok := <-client:
			if !ok {
				return
			}
			w.Write(data)
			flusher.Flush()
		}
	}
}
