import { useState, useRef, useEffect } from 'react';
import './FloatingActionButton.css';

const FloatingActionButton = ({ 
  onOpenHelp, 
  onOpenRecord, 
  onExportStudyNotes, 
  onToggleMode, 
  isHelperMode 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDemoMode, setShowDemoMode] = useState(false);
  const fabRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabRef.current && !fabRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowDemoMode(false);
      }
    };

    if (isOpen || showDemoMode) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showDemoMode]);

  const handleMainAction = () => {
    setIsOpen(!isOpen);
    setShowDemoMode(false);
  };

  const handleDemoMode = () => {
    setShowDemoMode(!showDemoMode);
    setIsOpen(false);
  };

  const actions = [
    {
      icon: '📤',
      label: 'Export Notes',
      onClick: () => {
        onExportStudyNotes();
        setIsOpen(false);
      },
      className: 'export-action'
    },
    {
      icon: '🎭',
      label: 'Demo Mode',
      onClick: handleDemoMode,
      className: 'demo-action'
    }
  ];

  return (
    <div className="floating-action-button" ref={fabRef}>
      {/* Demo Mode Panel */}
      {showDemoMode && (
        <div className="demo-mode-panel">
          <div className="panel-header">
            <h4>🎭 Demo Mode</h4>
            <p>Test collaborative learning features</p>
          </div>
          
          <div className="mode-switcher">
            <button 
              className={`mode-btn ${!isHelperMode ? 'active' : ''}`}
              onClick={() => {
                onToggleMode(false);
                setShowDemoMode(false);
              }}
            >
              <div className="mode-icon">📚</div>
              <div className="mode-text">
                <strong>Student A</strong>
                <small>Needs Help</small>
              </div>
            </button>
            
            <button 
              className={`mode-btn ${isHelperMode ? 'active' : ''}`}
              onClick={() => {
                onToggleMode(true);
                setShowDemoMode(false);
              }}
            >
              <div className="mode-icon">🎓</div>
              <div className="mode-text">
                <strong>Student B</strong>
                <small>Helper</small>
              </div>
            </button>
          </div>

          {isHelperMode && (
            <button 
              className="test-record-btn"
              onClick={() => {
                if (window.testRecordHelp) {
                  window.testRecordHelp();
                }
                setShowDemoMode(false);
              }}
            >
              🧪 Test Recording
            </button>
          )}
        </div>
      )}

      {/* Action Menu */}
      {isOpen && (
        <div className="fab-menu">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`fab-action ${action.className}`}
              onClick={action.onClick}
              title={action.label}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <button 
        className={`fab-main ${isOpen ? 'open' : ''}`}
        onClick={handleMainAction}
        title="Options"
      >
        <span className={`fab-icon ${isOpen ? 'rotated' : ''}`}>
          ⚡
        </span>
      </button>
    </div>
  );
};

export default FloatingActionButton;