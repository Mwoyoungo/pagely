import { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import './Auth.css';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal" onClick={handleOverlayClick}>
      <div className="auth-modal-content">
        <button className="auth-close" onClick={onClose}>
          ×
        </button>
        
        {isLoginMode ? (
          <Login 
            onSwitchToSignup={() => setIsLoginMode(false)}
            onClose={onClose}
          />
        ) : (
          <Signup 
            onSwitchToLogin={() => setIsLoginMode(true)}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;