import { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import './HelpRequestPopup.css';

const HelpRequestPopup = ({ isOpen, onClose, selectedText, position, onHelpRequested }) => {
  const [requesting, setRequesting] = useState(false);
  const [selectedHelpType, setSelectedHelpType] = useState(null);
  const [specificRequest, setSpecificRequest] = useState('');
  const { showNotification } = useNotifications();

  const helpTypes = [
    {
      id: 'explain',
      title: '📝 Explain this concept',
      description: 'Get a detailed explanation from a tutor'
    },
    {
      id: 'example',
      title: '💡 Give me an example',
      description: 'See practical examples and use cases'
    },
    {
      id: 'buddy',
      title: '👥 Find study buddy',
      description: 'Connect with someone studying the same topic'
    }
  ];

  const handleHelpTypeClick = (helpType) => {
    if (helpType.id === 'explain') {
      setSelectedHelpType(helpType);
    } else {
      requestHelp(helpType);
    }
  };

  const requestHelp = async (helpType, specificDetails = '') => {
    setRequesting(true);
    
    try {
      // Create help request object
      const helpRequest = {
        id: `help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: helpType.id,
        title: helpType.title,
        selectedText,
        specificRequest: specificDetails,
        position,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      };

      // Simulate request processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      showNotification(`${helpType.title} request sent! Looking for helpers...`, 'success');
      
      // Notify parent component about the help request
      onHelpRequested?.(helpRequest);
      
      onClose();
      resetState();

      // Simulate finding a helper
      setTimeout(() => {
        showNotification('Great news! Sarah is ready to help. Starting connection...', 'success');
      }, 3000);

    } catch (error) {
      console.error('Error requesting help:', error);
      showNotification('Failed to send help request', 'error');
    } finally {
      setRequesting(false);
    }
  };

  const submitSpecificRequest = () => {
    if (!specificRequest.trim()) {
      showNotification('Please specify what you need help with', 'error');
      return;
    }
    requestHelp(selectedHelpType, specificRequest);
  };

  const resetState = () => {
    setSelectedHelpType(null);
    setSpecificRequest('');
    setRequesting(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      resetState();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup help-popup">
        <button className="close-popup" onClick={() => { onClose(); resetState(); }}>
          &times;
        </button>
        
        <h3>Get Help With This</h3>
        
        {selectedText && (
          <div className="selected-text-preview">
            "{selectedText}"
          </div>
        )}
        
        {!selectedHelpType ? (
          <div className="help-options">
            {helpTypes.map(helpType => (
              <div 
                key={helpType.id}
                className={`help-option ${requesting ? 'disabled' : ''}`}
                onClick={() => !requesting && handleHelpTypeClick(helpType)}
              >
                <strong>{helpType.title}</strong>
                <p>{helpType.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="specific-request-form">
            <h4>What specifically do you need explained?</h4>
            <p className="form-instruction">
              Be specific about what you want to understand about this text:
            </p>
            <textarea
              className="specific-request-input"
              placeholder="e.g., 'Can you explain how this formula works?', 'What does this concept mean in simple terms?', 'How does this relate to...?'"
              value={specificRequest}
              onChange={(e) => setSpecificRequest(e.target.value)}
              rows={4}
              disabled={requesting}
            />
            <div className="form-actions">
              <button 
                className="back-btn"
                onClick={() => setSelectedHelpType(null)}
                disabled={requesting}
              >
                ← Back
              </button>
              <button 
                className="submit-request-btn"
                onClick={submitSpecificRequest}
                disabled={requesting || !specificRequest.trim()}
              >
                Send Request
              </button>
            </div>
          </div>
        )}
        
        {requesting && (
          <div className="requesting-help">
            <div className="spinner" />
            <p>Sending help request...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpRequestPopup;