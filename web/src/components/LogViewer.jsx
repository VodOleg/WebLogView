import { useEffect, useRef, useState } from 'preact/hooks';
import { FixedSizeList as List } from 'react-window';

export function LogViewer({ lines, autoScroll, title }) {
  const listRef = useRef(null);
  const containerRef = useRef(null);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    if (autoScroll && listRef.current && lines.length > 0) {
      listRef.current.scrollToItem(lines.length - 1, 'end');
    }
  }, [lines, autoScroll]);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setHeight(rect.height - 30); // Subtract title bar height
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const Row = ({ index, style }) => (
    <div style={{ ...style, ...rowStyle }}>
      <span style={lineNumberStyle}>{index + 1}</span>
      <span style={lineContentStyle}>{lines[index]}</span>
    </div>
  );

  return (
    <div ref={containerRef} style={{ height: '100%', backgroundColor: '#1e1e1e', display: 'flex', flexDirection: 'column' }}>
      {title && (
        <div style={titleBarStyle}>
          {title}
        </div>
      )}
      <List
        ref={listRef}
        height={height}
        itemCount={lines.length}
        itemSize={20}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
}

const titleBarStyle = {
  backgroundColor: '#2d2d30',
  color: '#cccccc',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: '500',
  borderBottom: '1px solid #3c3c3c',
};

const rowStyle = {
  display: 'flex',
  fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
  fontSize: '13px',
  lineHeight: '20px',
  borderBottom: '1px solid #2d2d2d',
  padding: '0 8px',
};

const lineNumberStyle = {
  color: '#858585',
  marginRight: '16px',
  minWidth: '60px',
  textAlign: 'right',
  userSelect: 'none',
};

const lineContentStyle = {
  color: '#d4d4d4',
  whiteSpace: 'pre',
  flex: 1,
};
