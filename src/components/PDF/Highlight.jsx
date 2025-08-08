import { useState } from 'react';
import './Highlight.css';

const Highlight = ({ 
  highlight, 
  isPending = false, 
  onClick, 
  onHelpRequest, 
  style 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(highlight);
  };

  const handleHelpRequest = (e) => {
    e.stopPropagation();
    onHelpRequest?.(highlight);
  };

  const getHighlightClass = () => {
    let className = 'pdf-highlight';
    if (isPending) className += ' pending';
    if (highlight.hasHelp) className += ' has-help';
    if (isHovered) className += ' hovered';
    return className;
  };

  return (
    <>
      {/* Main highlight overlay */}
      <div
        className={getHighlightClass()}
        style={{
          ...style,
          position: 'absolute',
          backgroundColor: isPending 
            ? 'rgba(255, 193, 7, 0.4)' 
            : highlight.hasHelp 
              ? 'rgba(76, 175, 80, 0.3)' 
              : 'rgba(255, 235, 59, 0.3)',
          border: isPending 
            ? '2px dashed #ffc107' 
            : highlight.hasHelp 
              ? '1px solid #4caf50' 
              : '1px solid #ffeb3b',
          cursor: 'pointer',
          borderRadius: '2px',
          transition: 'all 0.2s ease'
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={highlight.text}
      />

      {/* Help indicator for highlights with help */}
      {highlight.hasHelp && (
        <div
          className="help-indicator"
          style={{
            position: 'absolute',
            left: `${parseFloat(style.left) + parseFloat(style.width)}%`,
            top: style.top,
            transform: 'translateX(-50%)',
            zIndex: 12
          }}
          onClick={handleClick}
        >
          💡
        </div>
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <div
          className="highlight-tooltip"
          style={{
            position: 'absolute',
            left: style.left,
            top: `${parseFloat(style.top) - 5}%`,
            zIndex: 15
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-text">"{highlight.text.slice(0, 50)}..."</div>
            <div className="tooltip-actions">
              {!highlight.hasHelp && (
                <button 
                  className="tooltip-btn help-btn"
                  onClick={handleHelpRequest}
                >
                  Get Help
                </button>
              )}
              <button 
                className="tooltip-btn view-btn"
                onClick={handleClick}
              >
                {highlight.hasHelp ? 'View Help' : 'View'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Highlight;