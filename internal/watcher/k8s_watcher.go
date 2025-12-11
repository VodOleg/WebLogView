package watcher

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"log"
	"path/filepath"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

// K8sWatcher watches Kubernetes pod logs
type K8sWatcher struct {
	clientset     *kubernetes.Clientset
	namespace     string
	podName       string
	containerName string
	tailLines     int64
	ctx           context.Context
	cancel        context.CancelFunc
}

// K8sConfig contains configuration for Kubernetes connection
type K8sConfig struct {
	Namespace     string
	PodName       string
	ContainerName string
	TailLines     int64
}

// NewK8sWatcher creates a new Kubernetes log watcher
func NewK8sWatcher(cfg K8sConfig) (*K8sWatcher, error) {
	// Build kubeconfig
	clientset, err := getKubernetesClient()
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes client: %w", err)
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &K8sWatcher{
		clientset:     clientset,
		namespace:     cfg.Namespace,
		podName:       cfg.PodName,
		containerName: cfg.ContainerName,
		tailLines:     cfg.TailLines,
		ctx:           ctx,
		cancel:        cancel,
	}, nil
}

// Watch streams logs from the Kubernetes pod
func (w *K8sWatcher) Watch(callback func([]string), initialCallback func([]string)) error {
	defer w.cancel()

	opts := &corev1.PodLogOptions{
		Follow:     true,
		Timestamps: false,
		TailLines:  &w.tailLines,
	}

	// Add container name if specified
	if w.containerName != "" {
		opts.Container = w.containerName
	}

	// Get log stream
	req := w.clientset.CoreV1().Pods(w.namespace).GetLogs(w.podName, opts)
	stream, err := req.Stream(w.ctx)
	if err != nil {
		// Check for authentication errors
		errMsg := err.Error()
		if strings.Contains(errMsg, "Unauthorized") || strings.Contains(errMsg, "authentication") || strings.Contains(errMsg, "forbidden") {
			return fmt.Errorf("authentication expired or insufficient permissions - please re-authenticate with your cluster: %w", err)
		}
		return fmt.Errorf("failed to open log stream: %w", err)
	}
	defer stream.Close()

	log.Printf("Started watching pod %s/%s", w.namespace, w.podName)

	// Buffer for initial lines
	initialLines := make([]string, 0, int(w.tailLines))
	isInitialLoad := true
	initialLoadStartTime := time.Now()
	initialLoadTimeout := 1000 * time.Millisecond

	// Read logs line by line
	reader := bufio.NewReader(stream)
	for {
		select {
		case <-w.ctx.Done():
			log.Println("K8s watcher stopped")
			return nil
		default:
			// Check if we should end initial load due to timeout
			if isInitialLoad && time.Since(initialLoadStartTime) > initialLoadTimeout {
				if len(initialLines) > 0 {
					initialCallback(initialLines)
					log.Printf("Sent initial %d lines for pod %s/%s (timeout), switching to streaming mode", len(initialLines), w.namespace, w.podName)
				}
				isInitialLoad = false
			}

			line, err := reader.ReadString('\n')
			if err != nil {
				// If we hit EOF or error during initial load, send what we have
				if isInitialLoad && len(initialLines) > 0 {
					initialCallback(initialLines)
				}

				if err == io.EOF {
					// Stream ended - could be pod termination or auth expiry
					log.Printf("K8s stream ended for pod %s/%s", w.namespace, w.podName)
					return fmt.Errorf("log stream ended - pod may have terminated or authentication expired")
				}
				// Check for auth errors in stream errors
				errMsg := err.Error()
				if strings.Contains(errMsg, "Unauthorized") || strings.Contains(errMsg, "authentication") || strings.Contains(errMsg, "forbidden") {
					return fmt.Errorf("authentication expired - please re-authenticate with your cluster: %w", err)
				}
				return fmt.Errorf("error reading log stream: %w", err)
			}

			if line != "" {
				// Remove trailing newline
				if line[len(line)-1] == '\n' {
					line = line[:len(line)-1]
				}

				if isInitialLoad {
					initialLines = append(initialLines, line)
					// Switch to streaming mode when we've collected expected number of lines
					if len(initialLines) >= int(w.tailLines) {
						initialCallback(initialLines)
						isInitialLoad = false
						log.Printf("Sent initial %d lines for pod %s/%s, switching to streaming mode", len(initialLines), w.namespace, w.podName)
					}
				} else {
					callback([]string{line})
				}
			}
		}
	}
}

// Stop stops watching the pod logs
func (w *K8sWatcher) Stop() {
	if w.cancel != nil {
		w.cancel()
	}
}

// getKubernetesClient creates a Kubernetes client
func getKubernetesClient() (*kubernetes.Clientset, error) {
	// Try in-cluster config first
	config, err := rest.InClusterConfig()
	if err != nil {
		// Fall back to kubeconfig
		var kubeconfig string
		if home := homedir.HomeDir(); home != "" {
			kubeconfig = filepath.Join(home, ".kube", "config")
		}

		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return nil, fmt.Errorf("failed to build config: %w", err)
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create clientset: %w", err)
	}

	return clientset, nil
}
