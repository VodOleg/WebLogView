import { useState, useEffect, useMemo } from 'preact/hooks';
import { ControlBar } from './ControlBar';
import { LogViewer } from './LogViewer';
import { DropZone } from './DropZone';
import { ResizablePanes } from './ResizablePanes';
import { useWebSocket } from '../hooks/useWebSocket';

export function LogViewerTab({ tabId, onTitleChange }) {
  const [lines, setLines] = useState([]);
  const [includeFilter, setIncludeFilter] = useState('');
  const [excludeFilter, setExcludeFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(
    `ws://${window.location.host}/ws`
  );

  useEffect(() => {
    setConnected(connectionStatus === 'connected');
  }, [connectionStatus]);

  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  const handleWebSocketMessage = (message) => {
    console.log('Processing message:', message.data);
    const data = JSON.parse(message.data);
    
    switch (data.type) {
      case 'lines':
        console.log('Received new lines:', data.lines.length);
        setLines(prev => [...prev, ...data.lines]);
        break;
      case 'initial':
        console.log('Received initial lines:', data.lines.length);
        setLines(data.lines || []);
        break;
      case 'clear':
        console.log('Clearing lines');
        setLines([]);
        break;
      case 'error':
        console.error('WebSocket error:', data.message || data.error);
        alert('Error: ' + (data.message || data.error));
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  };

  const handleFileDrop = (filePath) => {
    console.log('Opening file:', filePath, 'Connected:', connected);
    if (filePath && connected) {
      // Extract filename from path for tab title
      const fileName = filePath.split('/').pop().split('\\').pop();
      const message = {
        type: 'open',
        path: filePath,
        tail: 1000,
      };
      console.log('Sending message:', message);
      sendMessage(message);
      setFileName(fileName);
      onTitleChange(fileName);
    } else {
      if (!connected) {
        alert('WebSocket not connected. Please wait...');
      }
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
    let filtered = lines;

    if (includeFilter) {
      try {
        const regex = new RegExp(includeFilter, 'i');
        filtered = filtered.filter(line => regex.test(line));
      } catch (e) {
        // Invalid regex, skip filtering
      }
    }

    if (excludeFilter) {
      try {
        const regex = new RegExp(excludeFilter, 'i');
        filtered = filtered.filter(line => !regex.test(line));
      } catch (e) {
        // Invalid regex, skip filtering
      }
    }

    return filtered;
  }, [lines, includeFilter, excludeFilter]);

  const hasLog = lines.length > 0;
  const hasFilters = includeFilter || excludeFilter;

  return (
    <div 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ResizablePanes
        topPane={
          hasLog ? (
            <LogViewer
              lines={lines}
              autoScroll={autoScroll}
              title="All Lines"
            />
          ) : (
            <DropZone isDragging={isDragging} onFileSelect={handleFileDrop} />
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
            filteredLineCount={filteredLines.length}
            totalLines={lines.length}
          />
        }
        bottomPane={
          hasLog ? (
            <LogViewer
              lines={filteredLines}
              autoScroll={autoScroll}
              title={hasFilters ? "Filtered Lines" : "All Lines"}
            />
          ) : (
            <div style={{ height: '100%', backgroundColor: '#1e1e1e' }} />
          )
        }
      />
    </div>
  );
}
