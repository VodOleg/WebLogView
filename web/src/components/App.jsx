import { useState } from 'preact/hooks';
import { LogViewerTab } from './LogViewerTab';

export function App() {
  const [tabs, setTabs] = useState([{ id: 1, title: 'New Tab' }]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextId, setNextId] = useState(2);

  const addTab = () => {
    const newTab = { id: nextId, title: 'New Tab' };
    setTabs([...tabs, newTab]);
    setActiveTabId(nextId);
    setNextId(nextId + 1);
  };

  const closeTab = (tabId) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    
    // If we're closing the active tab, switch to another tab
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
    
    // Always keep at least one tab
    if (newTabs.length === 0) {
      const newTab = { id: nextId, title: 'New Tab' };
      setTabs([newTab]);
      setActiveTabId(nextId);
      setNextId(nextId + 1);
    } else {
      setTabs(newTabs);
    }
  };

  const updateTabTitle = (tabId, title) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId ? { ...tab, title } : tab
    ));
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Tab Bar */}
      <div style={styles.tabBar}>
        <div style={styles.tabsContainer}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              style={{
                ...styles.tab,
                ...(activeTabId === tab.id ? styles.activeTab : {})
              }}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span style={styles.tabTitle}>{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  style={styles.closeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button style={styles.addTabButton} onClick={addTab}>
            +
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {tabs.map(tab => (
        <div
          key={tab.id}
          style={{
            display: activeTabId === tab.id ? 'flex' : 'none',
            flex: 1,
            flexDirection: 'column',
          }}
        >
          <LogViewerTab
            tabId={tab.id}
            onTitleChange={(title) => updateTabTitle(tab.id, title)}
          />
        </div>
      ))}
    </div>
  );
}

const styles = {
  tabBar: {
    backgroundColor: '#2d2d30',
    borderBottom: '1px solid #3c3c3c',
    display: 'flex',
    alignItems: 'flex-end',
    minHeight: '24px',
  },
  tabsContainer: {
    display: 'flex',
    gap: '1px',
    paddingLeft: '3px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#252526',
    borderTop: '2px solid transparent',
    borderLeft: '1px solid #3c3c3c',
    borderRight: '1px solid #3c3c3c',
    borderTopLeftRadius: '2px',
    borderTopRightRadius: '2px',
    color: '#969696',
    cursor: 'pointer',
    fontSize: '11px',
    minWidth: '80px',
    maxWidth: '140px',
    transition: 'all 0.1s ease',
  },
  activeTab: {
    backgroundColor: '#1e1e1e',
    borderTopColor: '#007acc',
    color: '#ffffff',
  },
  tabTitle: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0 2px',
    lineHeight: '1',
    opacity: 0.6,
    transition: 'opacity 0.1s ease',
  },
  addTabButton: {
    background: 'none',
    border: 'none',
    color: '#969696',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '3px 8px',
    transition: 'color 0.1s ease',
  },
};
