package watcher

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ListPodsInNamespace returns a list of pod names in the given namespace
func ListPodsInNamespace(namespace string) ([]string, error) {
	clientset, err := getKubernetesClient()
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes client: %w", err)
	}

	// First, verify the namespace exists
	_, err = clientset.CoreV1().Namespaces().Get(context.TODO(), namespace, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("namespace '%s' not found or inaccessible: %w", namespace, err)
	}

	pods, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list pods: %w", err)
	}

	podNames := make([]string, 0, len(pods.Items))
	for _, pod := range pods.Items {
		podNames = append(podNames, pod.Name)
	}

	return podNames, nil
}

// ListContainersInPod returns a list of container names in the given pod
func ListContainersInPod(namespace, podName string) ([]string, error) {
	clientset, err := getKubernetesClient()
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes client: %w", err)
	}

	pod, err := clientset.CoreV1().Pods(namespace).Get(context.TODO(), podName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get pod: %w", err)
	}

	containerNames := make([]string, 0, len(pod.Spec.Containers))
	for _, container := range pod.Spec.Containers {
		containerNames = append(containerNames, container.Name)
	}

	return containerNames, nil
}
