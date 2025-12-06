# Kubernetes Integration

WebLogView now supports streaming logs directly from Kubernetes pods!

## Features

- **Side-by-side UI**: Choose between file source or Kubernetes pod
- **Real-time streaming**: Live log updates from pods
- **Auto-reconnection**: Handles pod restarts automatically
- **All existing features work**: Filtering, ANSI colors, line highlighting, etc.

## Usage

### 1. Start WebLogView

```bash
./weblogview
```

### 2. Choose Source

On the initial screen, you'll see two options:

**📄 Open Log File** (left side)
- Enter file path as before
- Works with local files

**☸️ Connect to Kubernetes** (right side)
- Namespace: `default` (or your namespace)
- Pod Name: `my-app-pod-12345`
- Container Name: (optional - defaults to first container)

### 3. Connect to Pod

Fill in the Kubernetes connection details and click "Connect to Pod".

The app will:
- Connect to your Kubernetes cluster using `~/.kube/config`
- Stream logs in real-time
- Display them just like file logs

## Requirements

- Kubernetes cluster access
- `~/.kube/config` configured
- Permissions to read pod logs (RBAC)

## How It Works

```
K8s Pod → client-go → K8sWatcher → WebSocket → Browser
```

1. **Backend** uses official `k8s.io/client-go` library
2. **K8sWatcher** streams logs using `PodLogs()` API
3. **WebSocket** sends log lines to frontend
4. **Frontend** displays them with all existing features

## WebSocket Message Format

### Connect to Pod

```json
{
  "type": "open-k8s",
  "namespace": "default",
  "podName": "my-app-12345",
  "containerName": "app"
}
```

### Connect to File (existing)

```json
{
  "type": "open",
  "path": "/var/log/app.log"
}
```

## Code Structure

**Backend:**
- `/internal/watcher/k8s_watcher.go` - Kubernetes log streaming
- `/internal/websocket/client.go` - Updated to handle both sources

**Frontend:**
- `/web/src/components/K8sConnector.jsx` - K8s connection form
- `/web/src/components/DropZone.jsx` - Side-by-side source selector
- `/web/src/components/LogViewerTab.jsx` - Updated to handle K8s

## Example: Viewing Pod Logs

1. Deploy an app to Kubernetes:
```bash
kubectl run nginx --image=nginx
```

2. Open WebLogView and connect:
- Namespace: `default`
- Pod Name: `nginx`
- Container: (leave empty)

3. See logs in real-time!

## Troubleshooting

**"Failed to connect to Kubernetes"**
- Check `~/.kube/config` exists and is valid
- Run `kubectl get pods` to verify cluster access

**"Error reading log stream"**
- Pod might have terminated
- Check pod exists: `kubectl get pod <podname> -n <namespace>`

**"Permission denied"**
- Your Kubernetes user needs permissions:
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: pod-log-reader
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list"]
```

## Future Enhancements

- [ ] Pod auto-discovery (dropdown list)
- [ ] Multi-pod aggregated view
- [ ] Label selectors (all pods with `app=myapp`)
- [ ] Historical logs with date range
- [ ] Context switching (multiple clusters)
- [ ] Save favorite pod connections
