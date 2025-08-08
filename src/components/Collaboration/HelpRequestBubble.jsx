import { useState } from 'react';
import './HelpRequestBubble.css';

const HelpRequestBubble = ({ 
  highlight, 
  onRecordHelp, 
  style 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleRecordClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🎤 Recording help for highlight:', highlight.id);
    console.log('🎤 Highlight text:', highlight.text);
    
    // Close the tooltip after clicking
    setIsClicked(false);
    setIsHovered(false);
    
    onRecordHelp(highlight);
  };

  if (!highlight.needsHelp) {
    return null; // Don't show if help already provided
  }

  return (
    <>
      {/* Help request indicator */}
      <div
        className="help-request-bubble"
        style={{
          ...style,
          position: 'absolute',
          transform: 'translate(-50%, -50%)'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => !isClicked && setIsHovered(false)}
        onClick={() => {
          setIsClicked(true);
          setIsHovered(true);
        }}
        title={`Help needed: "${highlight.text.slice(0, 50)}..."`}
      >
        🤚
        <div className="help-pulse-ring" />
      </div>

      {/* Hover/Click tooltip */}
      {(isHovered || isClicked) && (
        <div
          className="help-request-tooltip"
          style={{
            position: 'absolute',
            left: style.left,
            top: `${parseFloat(style.top) - 8}%`,
            transform: 'translateX(-50%)',
            zIndex: 20
          }}
        >
          <div className="tooltip-content">
            <button 
              className="tooltip-close"
              onClick={(e) => {
                e.stopPropagation();
                setIsClicked(false);
                setIsHovered(false);
              }}
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: '#999'
              }}
            >
              ×
            </button>
            <div className="help-text">
              <strong>Help Requested:</strong>
              <div className="selected-text">"{highlight.text.slice(0, 80)}..."</div>
            </div>
            <div className="help-actions">
              <button 
                className="record-help-btn"
                onClick={handleRecordClick}
                style={{
                  background: '#ff9800',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🎤 Record Explanation
              </button>
            </div>
            <div className="help-meta">
              Requested by another student • {getTimeAgo(highlight.createdAt)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const getTimeAgo = (timestamp) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now - then;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${Math.floor(hours / 24)}d ago`;
  }
};

export default HelpRequestBubble;