import { useEffect, useRef } from 'preact/hooks';
import { FixedSizeList as List } from 'react-window';

export function LogViewer({ lines, autoScroll }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (autoScroll && listRef.current && lines.length > 0) {
      listRef.current.scrollToItem(lines.length - 1, 'end');
    }
  }, [lines, autoScroll]);

  const Row = ({ index, style }) => (
    <div style={{ ...style, ...rowStyle }}>
      <span style={lineNumberStyle}>{index + 1}</span>
      <span style={lineContentStyle}>{lines[index]}</span>
    </div>
  );

  return (
    <div style={{ flex: 1, backgroundColor: '#1e1e1e' }}>
      <List
        ref={listRef}
        height={window.innerHeight - 120} // Adjust based on header height
        itemCount={lines.length}
        itemSize={20}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
}

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
