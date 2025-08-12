import { useState, useEffect } from 'react';
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
  const [currentAudio, setCurrentAudio] = useState(null);

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
    // If currently playing, pause the audio
    if (isPlaying && currentAudio) {
      pauseAudio();
      return;
    }
    
    // If audio exists and is paused, resume playback
    if (currentAudio && currentAudio.paused) {
      resumeAudio();
      return;
    }
    
    console.log('🔊 Playing voice explanation for:', highlight.text.slice(0, 30));
    console.log('🔊 Audio URL:', voiceExplanation.audioUrl);
    
    const audio = new Audio();
    // Set CORS mode to handle cross-origin audio
    audio.crossOrigin = 'anonymous';
    audio.src = voiceExplanation.audioUrl;
    
    audio.onloadstart = () => {
      console.log('🔄 Audio loading started...');
    };
    
    audio.oncanplay = () => {
      console.log('✅ Audio can play');
    };
    
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
      console.log('✅ Voice explanation finished playing');
    };
    
    audio.onerror = (error) => {
      setIsPlaying(false);
      setCurrentAudio(null);
      console.error('❌ Error playing voice explanation:', error);
      console.error('❌ Audio error details:', audio.error);
    };
    
    audio.onpause = () => {
      setIsPlaying(false);
      console.log('⏸️ Audio paused');
    };
    
    audio.onplay = () => {
      setIsPlaying(true);
      console.log('▶️ Audio playing');
    };
    
    audio.onloadeddata = () => {
      console.log('📡 Audio data loaded, attempting to play...');
      audio.play().catch(error => {
        setIsPlaying(false);
        setCurrentAudio(null);
        console.error('❌ Failed to play voice explanation:', error);
      });
    };
    
    // Store audio reference and start loading
    setCurrentAudio(audio);
    audio.load();
  };
  
  const pauseAudio = () => {
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
    }
  };
  
  const resumeAudio = () => {
    if (currentAudio && currentAudio.paused) {
      currentAudio.play().catch(error => {
        console.error('❌ Failed to resume audio:', error);
        setIsPlaying(false);
      });
    }
  };
  
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  };
  
  // Cleanup audio when component unmounts or page is left
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopAudio();
    };
    
    const handlePageHide = () => {
      stopAudio();
    };
    
    // Add event listeners for page navigation
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    // Cleanup on component unmount
    return () => {
      stopAudio();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [currentAudio]);

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
          title={isPlaying ? "Click to pause" : "Click to play explanation"}
        >
          {isPlaying ? '⏸️' : '▶️'}
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
                <div className="voice-author">
                  by {highlight.voiceExplanations[0]?.authorName || 'Anonymous'}
                </div>
                <div className="play-instruction">
                  {isPlaying ? '⏸️ Playing... (click to pause)' : '▶️ Click to play explanation'}
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
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
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