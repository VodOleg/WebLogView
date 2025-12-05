import { useState, useEffect } from 'preact/hooks';

export function DropZone({ isDragging, onFileSelect }) {
  const [filePath, setFilePath] = useState('');
  const [recentFiles, setRecentFiles] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    // Load recent files
    fetch('/api/recent-files')
      .then(res => res.json())
      .then(files => setRecentFiles(files || []))
      .catch(err => console.error('Failed to load recent files:', err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (filePath.trim()) {
      onFileSelect(filePath.trim());
    }
  };

  const handleRecentFileClick = (path) => {
    setFilePath(path);
    setShowRecent(false);
  };

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.dropZone,
        ...(isDragging ? styles.dropZoneDragging : {})
      }}>
        <div style={styles.icon}>📄</div>
        <div style={styles.message}>
          Enter log file path to view
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="/path/to/your/logfile.log"
            value={filePath}
            onInput={(e) => setFilePath(e.target.value)}
            onFocus={() => setShowRecent(true)}
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.button}>
            Open
          </button>
        </form>
        
        {showRecent && recentFiles.length > 0 && (
          <div style={styles.recentContainer}>
            <div style={styles.recentHeader}>Recent Files:</div>
            {recentFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  ...styles.recentItem,
                  ...(hoveredIndex === index ? { backgroundColor: '#3c3c3c' } : {})
                }}
                onClick={() => handleRecentFileClick(file)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                📄 {file}
              </div>
            ))}
          </div>
        )}
        
        <div style={styles.hint}>
          {recentFiles.length > 0 
            ? 'Enter path or select from recent files above' 
            : 'Enter the full path to a log file on your system'}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e1e',
  },
  dropZone: {
    width: '80%',
    maxWidth: '800px',
    padding: '60px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e1e',
    border: '3px dashed #3c3c3c',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  dropZoneDragging: {
    backgroundColor: '#2d2d30',
    borderColor: '#007acc',
    transform: 'scale(0.98)',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px',
    opacity: 0.5,
  },
  message: {
    fontSize: '24px',
    color: '#cccccc',
    marginBottom: '12px',
    fontWeight: '500',
  },
  hint: {
    fontSize: '14px',
    color: '#858585',
  },
  form: {
    display: 'flex',
    gap: '8px',
    width: '100%',
    maxWidth: '500px',
    margin: '20px 0 10px 0',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#3c3c3c',
    border: '1px solid #555',
    color: '#d4d4d4',
    borderRadius: '4px',
    fontSize: '13px',
    outline: 'none',
  },
  button: {
    padding: '8px 24px',
    backgroundColor: '#0e639c',
    border: 'none',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  recentContainer: {
    width: '100%',
    maxWidth: '500px',
    marginTop: '10px',
    marginBottom: '10px',
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: '#2d2d30',
    border: '1px solid #3c3c3c',
    borderRadius: '4px',
  },
  recentHeader: {
    padding: '8px 12px',
    fontSize: '12px',
    color: '#858585',
    borderBottom: '1px solid #3c3c3c',
    fontWeight: '500',
  },
  recentItem: {
    padding: '8px 12px',
    fontSize: '13px',
    color: '#d4d4d4',
    cursor: 'pointer',
    fontFamily: 'monospace',
    transition: 'background-color 0.1s',
  },
};