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
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    
    // If highlight has voice explanations, play the first one
    if (highlight.voiceExplanations && highlight.voiceExplanations.length > 0) {
      playVoiceExplanation(highlight.voiceExplanations[0]);
    } else {
      onClick?.(highlight);
    }
  };

  const playVoiceExplanation = (voiceExplanation) => {
    if (isPlaying) return; // Prevent multiple plays
    
    console.log('🔊 Playing voice explanation for:', highlight.text.slice(0, 30));
    setIsPlaying(true);
    
    const audio = new Audio(voiceExplanation.audioUrl);
    
    audio.onended = () => {
      setIsPlaying(false);
      console.log('✅ Voice explanation finished playing');
    };
    
    audio.onerror = (error) => {
      setIsPlaying(false);
      console.error('❌ Error playing voice explanation:', error);
    };
    
    audio.play().catch(error => {
      setIsPlaying(false);
      console.error('❌ Failed to play voice explanation:', error);
    });
  };

  const handleHelpRequest = (e) => {
    e.stopPropagation();
    onHelpRequest?.(highlight);
  };

  const getHighlightClass = () => {
    let className = 'pdf-highlight';
    if (isPending) className += ' pending';
    if (highlight.hasHelp) className += ' has-help';
    if (highlight.voiceExplanations && highlight.voiceExplanations.length > 0) className += ' has-voice';
    if (isPlaying) className += ' playing';
    if (isHovered) className += ' hovered';
    return className;
  };

  const hasVoiceExplanation = highlight.voiceExplanations && highlight.voiceExplanations.length > 0;

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
            : hasVoiceExplanation
              ? 'rgba(76, 175, 80, 0.4)' 
              : highlight.hasHelp 
                ? 'rgba(255, 152, 0, 0.3)' 
                : 'rgba(255, 235, 59, 0.3)',
          border: isPending 
            ? '2px dashed #ffc107' 
            : hasVoiceExplanation
              ? '2px solid #4caf50'
              : highlight.hasHelp 
                ? '1px solid #ff9800' 
                : '1px solid #ffeb3b',
          boxShadow: isPlaying ? '0 0 10px rgba(76, 175, 80, 0.8)' : 'none',
          cursor: 'pointer',
          borderRadius: '2px',
          transition: 'all 0.2s ease'
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={hasVoiceExplanation 
          ? `🔊 Click to hear explanation: "${highlight.text}"` 
          : highlight.text}
      />

      {/* Voice/Help indicator */}
      {hasVoiceExplanation ? (
        <div
          className="voice-indicator"
          style={{
            position: 'absolute',
            left: `${parseFloat(style.left) + parseFloat(style.width)}%`,
            top: style.top,
            transform: 'translateX(-50%)',
            zIndex: 12,
            fontSize: '16px',
            animation: isPlaying ? 'pulse 1s infinite' : 'none'
          }}
          onClick={handleClick}
          title="Click to hear explanation"
        >
          {isPlaying ? '🔊' : '🎵'}
        </div>
      ) : highlight.needsHelp ? (
        <div
          className="help-request-indicator"
          style={{
            position: 'absolute',
            left: `${parseFloat(style.left) + parseFloat(style.width)}%`,
            top: style.top,
            transform: 'translateX(-50%)',
            zIndex: 12,
            fontSize: '16px',
            animation: 'bounce 2s infinite'
          }}
          onClick={handleClick}
          title="Help requested - waiting for response"
        >
          🖐️
        </div>
      ) : null}

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
            
            {hasVoiceExplanation && (
              <div className="voice-explanation-info">
                <div className="voice-count">
                  🎵 {highlight.voiceExplanations.length} explanation{highlight.voiceExplanations.length > 1 ? 's' : ''}
                </div>
                <div className="play-instruction">
                  {isPlaying ? '🔊 Playing...' : '🎵 Click to hear explanation'}
                </div>
              </div>
            )}
            
            <div className="tooltip-actions">
              {!highlight.hasHelp && !hasVoiceExplanation && (
                <button 
                  className="tooltip-btn help-btn"
                  onClick={handleHelpRequest}
                >
                  Get Help
                </button>
              )}
              {hasVoiceExplanation ? (
                <button 
                  className="tooltip-btn play-btn"
                  onClick={handleClick}
                  disabled={isPlaying}
                >
                  {isPlaying ? 'Playing...' : '🔊 Play'}
                </button>
              ) : (
                <button 
                  className="tooltip-btn view-btn"
                  onClick={handleClick}
                >
                  {highlight.hasHelp ? 'View Help' : 'View'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Highlight;