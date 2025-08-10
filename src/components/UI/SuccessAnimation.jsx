import { useState, useEffect } from 'react';
import './SuccessAnimation.css';

const SuccessAnimation = ({ message, onComplete, duration = 2000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Start animation
    setIsVisible(true);
    
    // Start exit animation
    const exitTimer = setTimeout(() => {
      setIsLeaving(true);
    }, duration - 300);

    // Complete and cleanup
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete && onComplete();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`success-animation ${isLeaving ? 'leaving' : ''}`}>
      <div className="success-content">
        <div className="success-icon">✓</div>
        <div className="success-message">{message}</div>
      </div>
      <div className="success-sparkles">
        <div className="sparkle sparkle-1">✨</div>
        <div className="sparkle sparkle-2">✨</div>
        <div className="sparkle sparkle-3">✨</div>
      </div>
    </div>
  );
};

export default SuccessAnimation;