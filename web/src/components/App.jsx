import { useState, useEffect, useMemo } from 'preact/hooks';
import { Header } from './Header';
import { LogViewer } from './LogViewer';
import { useWebSocket } from '../hooks/useWebSocket';

export function App() {
  const [filePath, setFilePath] = useState('');
  const [lines, setLines] = useState([]);
  const [includeFilter, setIncludeFilter] = useState('');
  const [excludeFilter, setExcludeFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [connected, setConnected] = useState(false);

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
    const data = JSON.parse(message.data);
    
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
        console.error('WebSocket error:', data.message);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  };

  const handleOpenFile = () => {
    if (filePath && connected) {
      sendMessage({
        type: 'open',
        path: filePath,
        tail: 1000,
      });
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        filePath={filePath}
        onFilePathChange={setFilePath}
        onOpenFile={handleOpenFile}
        includeFilter={includeFilter}
        onIncludeFilterChange={setIncludeFilter}
        excludeFilter={excludeFilter}
        onExcludeFilterChange={setExcludeFilter}
        autoScroll={autoScroll}
        onAutoScrollChange={setAutoScroll}
        connected={connected}
        lineCount={filteredLines.length}
        totalLines={lines.length}
      />
      <LogViewer
        lines={filteredLines}
        autoScroll={autoScroll}
      />
    </div>
  );
}
