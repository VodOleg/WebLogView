export function DropZone({ isDragging }) {
  return (
    <div style={styles.container}>
      <div style={{
        ...styles.dropZone,
        ...(isDragging ? styles.dropZoneDragging : {})
      }}>
        <div style={styles.icon}>📄</div>
        <div style={styles.message}>
          {isDragging ? 'Drop log file here' : 'Drop log file here to view'}
        </div>
        <div style={styles.hint}>
          Drag and drop a log file to start monitoring
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
};