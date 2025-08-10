import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import analyticsService from '../../services/analyticsService';
import './Auth.css';

const Login = ({ onSwitchToSignup, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signin, signinWithGoogle } = useAuth();
  const { showNotification } = useNotifications();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    
    try {
      await signin(email, password);
      analyticsService.trackUserSignin('email');
      showNotification('Welcome back to PagePop!', 'success');
      onClose();
    } catch (error) {
      console.error('Login error:', error);
      let message = 'Failed to sign in';
      
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/user-disabled') {
        message = 'Account has been disabled';
      }
      
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    try {
      await signinWithGoogle();
      analyticsService.trackUserSignin('google');
      showNotification('Welcome to PagePop!', 'success');
      onClose();
    } catch (error) {
      console.error('Google login error:', error);
      let message = 'Failed to sign in with Google';
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup blocked. Please allow popups and try again';
      }
      
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // Use demo credentials for testing
      await signin('demo@pagepop.com', 'demo123456');
      showNotification('Signed in as demo user!', 'success');
      onClose();
    } catch (error) {
      showNotification('Demo login failed. Please try regular sign-in.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h2>Welcome Back!</h2>
        <p>Sign in to continue your collaborative learning journey</p>
      </div>

      <form onSubmit={handleEmailLogin} className="auth-form">
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
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
              Signing In...
            </>
          ) : (
            '📚 Sign In'
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button 
        onClick={handleGoogleLogin}
        className="auth-btn google"
        disabled={loading}
      >
        <span>🔍</span>
        Continue with Google
      </button>

      <button 
        onClick={handleDemoLogin}
        className="auth-btn demo"
        disabled={loading}
      >
        <span>🧪</span>
        Try Demo Account
      </button>

      <div className="auth-footer">
        <p>
          Don't have an account?{' '}
          <button 
            onClick={onSwitchToSignup}
            className="link-btn"
            disabled={loading}
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;