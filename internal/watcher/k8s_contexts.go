package watcher

import (
	"fmt"
	"path/filepath"

	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

// K8sContext represents a Kubernetes context
type K8sContext struct {
	Name      string `json:"name"`
	Cluster   string `json:"cluster"`
	Namespace string `json:"namespace"`
	IsCurrent bool   `json:"isCurrent"`
}

// ListContexts returns a list of available Kubernetes contexts
func ListContexts() ([]K8sContext, error) {
	var kubeconfig string
	if home := homedir.HomeDir(); home != "" {
		kubeconfig = filepath.Join(home, ".kube", "config")
	} else {
		return nil, fmt.Errorf("could not determine home directory")
	}

	// Load kubeconfig
	config, err := clientcmd.LoadFromFile(kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to load kubeconfig: %w", err)
	}

	contexts := make([]K8sContext, 0, len(config.Contexts))
	currentContext := config.CurrentContext

	for name, context := range config.Contexts {
		ctx := K8sContext{
			Name:      name,
			Cluster:   context.Cluster,
			Namespace: context.Namespace,
			IsCurrent: name == currentContext,
		}
		// Set default namespace if not specified
		if ctx.Namespace == "" {
			ctx.Namespace = "default"
		}
		contexts = append(contexts, ctx)
	}

	return contexts, nil
}

// GetCurrentContext returns the currently active context
func GetCurrentContext() (string, error) {
	var kubeconfig string
	if home := homedir.HomeDir(); home != "" {
		kubeconfig = filepath.Join(home, ".kube", "config")
	} else {
		return "", fmt.Errorf("could not determine home directory")
	}

	config, err := clientcmd.LoadFromFile(kubeconfig)
	if err != nil {
		return "", fmt.Errorf("failed to load kubeconfig: %w", err)
	}

	return config.CurrentContext, nil
}

// SwitchContext changes the active Kubernetes context
func SwitchContext(contextName string) error {
	var kubeconfig string
	if home := homedir.HomeDir(); home != "" {
		kubeconfig = filepath.Join(home, ".kube", "config")
	} else {
		return fmt.Errorf("could not determine home directory")
	}

	// Load kubeconfig
	config, err := clientcmd.LoadFromFile(kubeconfig)
	if err != nil {
		return fmt.Errorf("failed to load kubeconfig: %w", err)
	}

	// Verify context exists
	if _, exists := config.Contexts[contextName]; !exists {
		return fmt.Errorf("context '%s' not found", contextName)
	}

	// Set current context
	config.CurrentContext = contextName

	// Write back to file
	if err := clientcmd.WriteToFile(*config, kubeconfig); err != nil {
		return fmt.Errorf("failed to write kubeconfig: %w", err)
	}

	return nil
}
