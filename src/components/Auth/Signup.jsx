import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './Auth.css';

const Signup = ({ onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { signup, signinWithGoogle } = useAuth();
  const { showNotification } = useNotifications();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showNotification('Please enter your name', 'error');
      return false;
    }

    if (!formData.email.trim()) {
      showNotification('Please enter your email', 'error');
      return false;
    }

    if (formData.password.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return false;
    }

    return true;
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      await signup(formData.email, formData.password, formData.name);
      showNotification('Welcome to PagePop! Your account has been created.', 'success');
      onClose();
    } catch (error) {
      console.error('Signup error:', error);
      let message = 'Failed to create account';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email already registered. Please use a different email or sign in.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Please choose a stronger password.';
      }
      
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    
    try {
      await signinWithGoogle();
      showNotification('Welcome to PagePop!', 'success');
      onClose();
    } catch (error) {
      console.error('Google signup error:', error);
      let message = 'Failed to sign up with Google';
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-up cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup blocked. Please allow popups and try again';
      }
      
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h2>Join PagePop!</h2>
        <p>Transform your PDFs into collaborative learning spaces</p>
      </div>

      <form onSubmit={handleEmailSignup} className="auth-form">
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Create a password (min 6 characters)"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your password"
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="auth-btn primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner small" />
              Creating Account...
            </>
          ) : (
            '🚀 Create Account'
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button 
        onClick={handleGoogleSignup}
        className="auth-btn google"
        disabled={loading}
      >
        <span>🔍</span>
        Continue with Google
      </button>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <button 
            onClick={onSwitchToLogin}
            className="link-btn"
            disabled={loading}
          >
            Sign in here
          </button>
        </p>
        <div className="terms">
          <small>
            By creating an account, you agree to collaborate respectfully 
            and help fellow students learn. 📚
          </small>
        </div>
      </div>
    </div>
  );
};

export default Signup;