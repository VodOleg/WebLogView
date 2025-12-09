import { useState, useEffect, useMemo } from 'preact/hooks';
import { ControlBar } from './ControlBar';
import { LogViewer } from './LogViewer';
import { DropZone } from './DropZone';
import { ResizablePanes } from './ResizablePanes';
import { SettingsModal } from './SettingsModal';
import { LogDetailModal } from './LogDetailModal';
import { useWebSocket } from '../hooks/useWebSocket';

export function LogViewerTab({ tabId, onTitleChange }) {
  const [lines, setLines] = useState([]);
  const [includeFilter, setIncludeFilter] = useState('');
  const [excludeFilter, setExcludeFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renderAnsiTopPane, setRenderAnsiTopPane] = useState(true);
  const [renderAnsiBottomPane, setRenderAnsiBottomPane] = useState(true);
  const [highlightedLineIndex, setHighlightedLineIndex] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [modalLogLine, setModalLogLine] = useState(null);
  const [modalLineNumber, setModalLineNumber] = useState(null);

  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(
    `ws://${window.location.host}/ws`
  );

  useEffect(() => {
    setConnected(connectionStatus === 'connected');
  }, [connectionStatus]);

  useEffect(() => {
    // Load settings on mount
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setRenderAnsiTopPane(data.renderAnsiTopPane);
        setRenderAnsiBottomPane(data.renderAnsiBottomPane);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
    // Reload settings after modal closes
    loadSettings();
  };

  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  const handleWebSocketMessage = (message) => {
    const data = JSON.parse(message.data);
    console.log('WebSocket message received:', data.type, data);
    
    switch (data.type) {
      case 'lines':
        setLines(prev => [...prev, ...data.lines]);
        break;
      case 'initial':
        setLines(data.lines || []);
        break;
      case 'clear':
        setLines([]);
        break;
      case 'error':
        console.error('WebSocket error:', data.message || data.error);
        const errorMsg = data.message || data.error;
        console.log('Setting error message:', errorMsg);
        setErrorMessage(errorMsg);
        // Don't show alert - the banner is enough and more visible
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  };

  const handleFileDrop = (filePath) => {
    if (filePath && connected) {
      // Extract filename from path for tab title
      const fileName = filePath.split('/').pop().split('\\').pop();
      const message = {
        type: 'open',
        path: filePath,
        // tail is omitted - backend will use settings value
      };
      sendMessage(message);
      setFileName(fileName);
      onTitleChange(fileName);
    } else {
      if (!connected) {
        alert('WebSocket not connected. Please wait...');
      }
    }
  };

  const handleK8sConnect = (k8sConfig) => {
    if (connected) {
      const message = {
        type: 'open-k8s',
        namespace: k8sConfig.namespace,
        podName: k8sConfig.podName,
        containerName: k8sConfig.containerName,
        // tail is omitted - backend will use settings value
      };
      sendMessage(message);
      const displayName = `${k8sConfig.namespace}/${k8sConfig.podName}`;
      setFileName(displayName);
      onTitleChange(displayName);
    } else {
      alert('WebSocket not connected. Please wait...');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Note: file.path is only available in Electron, not in browsers
      // For now, we'll just use the name and user needs to enter full path
      if (file.path) {
        handleFileDrop(file.path);
      }
    }
  };

  const filteredLines = useMemo(() => {
    let filtered = [];
    let originalIndices = [];

    if (includeFilter) {
      try {
        const regex = new RegExp(includeFilter, 'i');
        lines.forEach((line, index) => {
          if (regex.test(line)) {
            filtered.push(line);
            originalIndices.push(index);
          }
        });
      } catch (e) {
        // Invalid regex, use all lines
        filtered = lines;
        originalIndices = lines.map((_, i) => i);
      }
    } else {
      filtered = lines;
      originalIndices = lines.map((_, i) => i);
    }

    if (excludeFilter) {
      try {
        const regex = new RegExp(excludeFilter, 'i');
        const temp = [];
        const tempIndices = [];
        filtered.forEach((line, i) => {
          if (!regex.test(line)) {
            temp.push(line);
            tempIndices.push(originalIndices[i]);
          }
        });
        filtered = temp;
        originalIndices = tempIndices;
      } catch (e) {
        // Invalid regex, skip filtering
      }
    }

    return { lines: filtered, originalIndices };
  }, [lines, includeFilter, excludeFilter]);

  const handleLineClick = (filteredIndex) => {
    const originalIndex = filteredLines.originalIndices[filteredIndex];
    setHighlightedLineIndex(originalIndex);
    setAutoScroll(false);
  };

  const handleLineDoubleClick = (index, lineContent) => {
    setModalLogLine(lineContent);
    setModalLineNumber(index + 1);
  };

  const handleCloseModal = () => {
    setModalLogLine(null);
    setModalLineNumber(null);
  };

  const hasLog = lines.length > 0;
  const hasFilters = includeFilter || excludeFilter;

  return (
    <div 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {errorMessage && (
        <div style={{
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          borderBottom: '1px solid #cc0000'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 8px'
            }}
          >
            ✕
          </button>
        </div>
      )}
      <ResizablePanes
        topPane={
          hasLog ? (
            <LogViewer
              lines={lines}
              autoScroll={autoScroll}
              title="All Lines"
              renderAnsi={renderAnsiTopPane}
              highlightedLineIndex={highlightedLineIndex}
              onLineDoubleClick={handleLineDoubleClick}
            />
          ) : (
            <DropZone 
              isDragging={isDragging} 
              onFileSelect={handleFileDrop}
              onK8sConnect={handleK8sConnect}
            />
          )
        }
        controlBar={
          <ControlBar
            includeFilter={includeFilter}
            onIncludeFilterChange={setIncludeFilter}
            excludeFilter={excludeFilter}
            onExcludeFilterChange={setExcludeFilter}
            autoScroll={autoScroll}
            onAutoScrollChange={setAutoScroll}
            filteredLineCount={filteredLines.lines.length}
            totalLines={lines.length}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        }
        bottomPane={
          hasLog ? (
            <LogViewer
              lines={filteredLines.lines}
              autoScroll={autoScroll}
              title={hasFilters ? "Filtered Lines" : "All Lines"}
              renderAnsi={renderAnsiBottomPane}
              onLineClick={handleLineClick}
              onLineDoubleClick={handleLineDoubleClick}
            />
          ) : (
            <div style={{ height: '100%', backgroundColor: '#1e1e1e' }} />
          )
        }
      />
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={handleSettingsClose} 
      />
      {modalLogLine && (
        <LogDetailModal
          logLine={modalLogLine}
          lineNumber={modalLineNumber}
          onClose={handleCloseModal}
          renderAnsi={renderAnsiBottomPane}
        />
      )}
    </div>
  );
}
