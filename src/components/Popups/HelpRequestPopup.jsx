import { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import './HelpRequestPopup.css';

const HelpRequestPopup = ({ isOpen, onClose, selectedText, position, onHelpRequested }) => {
  const [requesting, setRequesting] = useState(false);
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

  const requestHelp = async (helpType) => {
    setRequesting(true);
    
    try {
      // Create help request object
      const helpRequest = {
        id: Date.now().toString(),
        type: helpType.id,
        title: helpType.title,
        selectedText,
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

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup help-popup">
        <button className="close-popup" onClick={onClose}>
          &times;
        </button>
        
        <h3>Get Help With This</h3>
        
        {selectedText && (
          <div className="selected-text-preview">
            "{selectedText}"
          </div>
        )}
        
        <div className="help-options">
          {helpTypes.map(helpType => (
            <div 
              key={helpType.id}
              className={`help-option ${requesting ? 'disabled' : ''}`}
              onClick={() => !requesting && requestHelp(helpType)}
            >
              <strong>{helpType.title}</strong>
              <p>{helpType.description}</p>
            </div>
          ))}
        </div>
        
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