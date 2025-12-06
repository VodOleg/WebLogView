import { useState, useEffect } from 'preact/hooks';

export function K8sConnector({ onConnect }) {
  const [namespace, setNamespace] = useState('default');
  const [podName, setPodName] = useState('');
  const [containerName, setContainerName] = useState('');
  const [recentNamespaces, setRecentNamespaces] = useState([]);
  const [showRecent, setShowRecent] = useState(false);

  useEffect(() => {
    // Load recent namespaces
    fetch('/api/recent-namespaces')
      .then(res => res.json())
      .then(namespaces => setRecentNamespaces(namespaces || []))
      .catch(err => console.error('Failed to load recent namespaces:', err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!podName.trim()) {
      alert('Pod name is required');
      return;
    }
    onConnect({
      namespace: namespace.trim() || 'default',
      podName: podName.trim(),
      containerName: containerName.trim(),
    });
  };

  const handleRecentNamespaceClick = (ns) => {
    setNamespace(ns);
    setShowRecent(false);
  };

  return (
    <div className="k8s-connector">
      <h3>Connect to Kubernetes Pod</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="namespace">Namespace:</label>
          <input
            id="namespace"
            type="text"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            onFocus={() => setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
            placeholder="default"
          />
          {showRecent && recentNamespaces.length > 0 && (
            <div className="recent-dropdown">
              {recentNamespaces.map((ns, index) => (
                <div
                  key={index}
                  className="recent-item"
                  onClick={() => handleRecentNamespaceClick(ns)}
                >
                  ☸️ {ns}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="podName">Pod Name: *</label>
          <input
            id="podName"
            type="text"
            value={podName}
            onChange={(e) => setPodName(e.target.value)}
            placeholder="my-app-pod-12345"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="containerName">Container Name:</label>
          <input
            id="containerName"
            type="text"
            value={containerName}
            onChange={(e) => setContainerName(e.target.value)}
            placeholder="(optional - first container)"
          />
        </div>

        <button type="submit" className="connect-button">
          Connect to Pod
        </button>
      </form>

      <style jsx>{`
        .k8s-connector {
          padding: 0;
          background: transparent;
          width: 100%;
          max-width: 500px;
        }

        h3 {
          margin-top: 0;
          color: #cccccc;
          fontSize: 16px;
          margin-bottom: 20px;
          display: none;
        }

        .form-group {
          margin-bottom: 15px;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #cccccc;
          font-size: 13px;
        }

        input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #555;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
          box-sizing: border-box;
          backgroundColor: '#3c3c3c';
          color: '#d4d4d4';
        }

        input:focus {
          outline: none;
          border-color: #007acc;
          box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
        }

        .connect-button {
          width: 100%;
          padding: 10px;
          background: #0e639c;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .connect-button:hover {
          background: #1177bb;
        }

        .connect-button:active {
          background: #0d5689;
        }

        .recent-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #2d2d30;
          border: 1px solid #555;
          border-radius: 4px;
          margin-top: 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .recent-item {
          padding: 8px 12px;
          cursor: pointer;
          color: #d4d4d4;
          font-size: 13px;
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
        }

        .recent-item:hover {
          background: #3c3c3c;
        }

        .form-group {
          position: relative;
        }
      `}</style>
    </div>
  );
}
