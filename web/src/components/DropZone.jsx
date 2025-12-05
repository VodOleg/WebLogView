import { useState } from 'preact/hooks';

export function DropZone({ isDragging, onFileSelect }) {
  const [filePath, setFilePath] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (filePath.trim()) {
      onFileSelect(filePath.trim());
    }
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
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.button}>
            Open
          </button>
        </form>
        <div style={styles.hint}>
          Enter the full path to a log file on your system
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
};