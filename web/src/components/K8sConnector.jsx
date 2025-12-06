import { useState, useEffect } from 'preact/hooks';

export function K8sConnector({ onConnect }) {
  const [namespace, setNamespace] = useState('default');
  const [podName, setPodName] = useState('');
  const [containerName, setContainerName] = useState('');
  const [recentNamespaces, setRecentNamespaces] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const [availablePods, setAvailablePods] = useState([]);
  const [showPods, setShowPods] = useState(false);
  const [filteredPods, setFilteredPods] = useState([]);
  const [availableContainers, setAvailableContainers] = useState([]);
  const [showContainers, setShowContainers] = useState(false);
  const [filteredContainers, setFilteredContainers] = useState([]);
  const [namespaceStatus, setNamespaceStatus] = useState(null); // 'valid', 'error', 'checking'
  const [namespaceError, setNamespaceError] = useState('');

  useEffect(() => {
    // Load recent namespaces and pre-populate if available
    fetch('/api/recent-namespaces')
      .then(res => res.json())
      .then(namespaces => {
        setRecentNamespaces(namespaces || []);
        // If there are recent namespaces, use the most recent one
        if (namespaces && namespaces.length > 0) {
          const recentNamespace = namespaces[0];
          setNamespace(recentNamespace);
          // Pre-populate pods for the recent namespace
          fetchPods(recentNamespace);
        }
      })
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
    fetchPods(ns);
  };

  const handleNamespaceChange = (value) => {
    setNamespace(value);
    // Validate namespace when user changes it
    if (value.trim() !== '') {
      fetchPods(value);
    } else {
      setNamespaceStatus(null);
      setNamespaceError('');
    }
  };

  const fetchPods = async (ns) => {
    if (!ns || ns.trim() === '') {
      setNamespaceStatus(null);
      setNamespaceError('');
      return;
    }
    
    setNamespaceStatus('checking');
    setNamespaceError('');
    
    try {
      const response = await fetch(`/api/k8s/pods?namespace=${encodeURIComponent(ns)}`);
      if (response.ok) {
        const pods = await response.json();
        setAvailablePods(pods || []);
        setFilteredPods(pods || []);
        setNamespaceStatus('valid');
        setNamespaceError('');
      } else {
        setAvailablePods([]);
        setFilteredPods([]);
        setNamespaceStatus('error');
        const errorText = await response.text();
        setNamespaceError(errorText || `Failed to fetch pods (${response.status})`);
      }
    } catch (err) {
      console.error('Failed to fetch pods:', err);
      setAvailablePods([]);
      setFilteredPods([]);
      setNamespaceStatus('error');
      setNamespaceError(err.message || 'Network error');
    }
  };

  const handlePodNameChange = (value) => {
    setPodName(value);
    
    // Filter pods based on input
    if (value.trim() === '') {
      setFilteredPods(availablePods);
    } else {
      const filtered = availablePods.filter(pod => 
        pod.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredPods(filtered);
    }
  };

  const handlePodNameFocus = () => {
    fetchPods(namespace);
    setShowPods(true);
  };

  const handlePodClick = (pod) => {
    setPodName(pod);
    setShowPods(false);
  };

  const fetchContainers = async (ns, pod) => {
    if (!ns || ns.trim() === '' || !pod || pod.trim() === '') return;
    
    try {
      const response = await fetch(`/api/k8s/containers?namespace=${encodeURIComponent(ns)}&pod=${encodeURIComponent(pod)}`);
      if (response.ok) {
        const containers = await response.json();
        setAvailableContainers(containers || []);
        setFilteredContainers(containers || []);
      } else {
        setAvailableContainers([]);
        setFilteredContainers([]);
      }
    } catch (err) {
      console.error('Failed to fetch containers:', err);
      setAvailableContainers([]);
      setFilteredContainers([]);
    }
  };

  const handleContainerNameChange = (value) => {
    setContainerName(value);
    
    // Filter containers based on input
    if (value.trim() === '') {
      setFilteredContainers(availableContainers);
    } else {
      const filtered = availableContainers.filter(container => 
        container.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredContainers(filtered);
    }
  };

  const handleContainerNameFocus = () => {
    fetchContainers(namespace, podName);
    setShowContainers(true);
  };

  const handleContainerClick = (container) => {
    setContainerName(container);
    setShowContainers(false);
  };

  return (
    <div className="k8s-connector">
      <h3>Connect to Kubernetes Pod</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="namespace">Namespace:</label>
          <div className="input-with-status">
            <input
              id="namespace"
              type="text"
              value={namespace}
              onChange={(e) => handleNamespaceChange(e.target.value)}
              onFocus={() => setShowRecent(true)}
              onBlur={() => setTimeout(() => setShowRecent(false), 200)}
              placeholder="default"
            />
            {namespaceStatus === 'checking' && (
              <span className="status-icon checking" title="Checking namespace...">
                ⏳
              </span>
            )}
            {namespaceStatus === 'valid' && (
              <span className="status-icon valid" title="Namespace is valid">
                ✓
              </span>
            )}
            {namespaceStatus === 'error' && (
              <span className="status-icon error" title={namespaceError}>
                ✕
              </span>
            )}
          </div>
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
            onChange={(e) => handlePodNameChange(e.target.value)}
            onFocus={handlePodNameFocus}
            onBlur={() => setTimeout(() => setShowPods(false), 200)}
            placeholder="my-app-pod-12345"
            required
          />
          {showPods && filteredPods.length > 0 && (
            <div className="pods-dropdown">
              {filteredPods.map((pod, index) => (
                <div
                  key={index}
                  className="pod-item"
                  onClick={() => handlePodClick(pod)}
                >
                  📦 {pod}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="containerName">Container Name:</label>
          <input
            id="containerName"
            type="text"
            value={containerName}
            onChange={(e) => handleContainerNameChange(e.target.value)}
            onFocus={handleContainerNameFocus}
            onBlur={() => setTimeout(() => setShowContainers(false), 200)}
            placeholder="(optional - first container)"
          />
          {showContainers && filteredContainers.length > 0 && (
            <div className="containers-dropdown">
              {filteredContainers.map((container, index) => (
                <div
                  key={index}
                  className="container-item"
                  onClick={() => handleContainerClick(container)}
                >
                  🔧 {container}
                </div>
              ))}
            </div>
          )}
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

        .pods-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #2d2d30;
          border: 1px solid #555;
          border-radius: 4px;
          margin-top: 4px;
          max-height: 250px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .pod-item {
          padding: 8px 12px;
          cursor: pointer;
          color: #d4d4d4;
          font-size: 13px;
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
          border-bottom: 1px solid #3c3c3c;
        }

        .pod-item:last-child {
          border-bottom: none;
        }

        .pod-item:hover {
          background: #3c3c3c;
        }

        .containers-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #2d2d30;
          border: 1px solid #555;
          border-radius: 4px;
          margin-top: 4px;
          max-height: 150px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .container-item {
          padding: 8px 12px;
          cursor: pointer;
          color: #d4d4d4;
          font-size: 13px;
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
          border-bottom: 1px solid #3c3c3c;
        }

        .container-item:last-child {
          border-bottom: none;
        }

        .container-item:hover {
          background: #3c3c3c;
        }

        .form-group {
          position: relative;
        }

        .input-with-status {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-status input {
          flex: 1;
          padding-right: 35px;
        }

        .status-icon {
          position: absolute;
          right: 10px;
          font-size: 16px;
          pointer-events: none;
          cursor: help;
        }

        .status-icon.checking {
          color: #ffa500;
          animation: pulse 1s ease-in-out infinite;
        }

        .status-icon.valid {
          color: #4ec9b0;
          font-weight: bold;
        }

        .status-icon.error {
          color: #f48771;
          font-weight: bold;
          pointer-events: auto;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
