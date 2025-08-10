import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserProfile from '../Auth/UserProfile';
import ActiveUsers from '../Collaboration/ActiveUsers';
import NotificationCenter from '../Notifications/NotificationCenter';
import AnalyticsDashboard from '../Admin/AnalyticsDashboard';
import './Header.css';

const Header = ({ currentDocument, onOpenMyDocs, onOpenAuth, currentUser, onBackToFeed }) => {
  const { userProfile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const menuRef = useRef(null);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleMenuItemClick = (action) => {
    setIsMobileMenuOpen(false);
    action();
  };

  return (
    <header className="header">
      <div className="header-left">
        {currentDocument && onBackToFeed ? (
          <button className="back-btn" onClick={onBackToFeed}>
            <span className="back-arrow">←</span>
            <span className="back-text">Back to Feed</span>
          </button>
        ) : (
          <div className="logo">
            <div className="logo-placeholder">📚</div>
            Collab
          </div>
        )}
      </div>
      
      {/* Desktop: Show active users and notifications in center */}
      {!isMobile && currentDocument && currentUser && (
        <div className="header-center">
          <ActiveUsers document={currentDocument} />
        </div>
      )}
      
      {/* Right side content */}
      <div className="header-right">
        {/* Mobile: Show active users + notifications together */}
        {isMobile && currentDocument && currentUser && (
          <div className="mobile-collaborators">
            <NotificationCenter />
            <ActiveUsers document={currentDocument} />
          </div>
        )}
        
        {/* Desktop: Regular user actions */}
        {!isMobile && (
          <div className="user-actions">
            {currentUser ? (
              <>
                <NotificationCenter />
                {userProfile?.isAdmin && (
                  <button 
                    className="analytics-btn" 
                    onClick={() => setShowAnalytics(true)}
                    title="Analytics Dashboard"
                  >
                    📊
                  </button>
                )}
                <button className="my-docs-btn" onClick={onOpenMyDocs}>
                  📚 My Documents
                </button>
                <UserProfile />
              </>
            ) : (
              <button className="auth-btn" onClick={onOpenAuth}>
                🚀 Sign In
              </button>
            )}
          </div>
        )}

        {/* Mobile: Burger menu */}
        {isMobile && (
          <div className="mobile-menu-container" ref={menuRef}>
            <button 
              className="burger-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              <span className={`burger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`burger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`burger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            </button>

            {isMobileMenuOpen && (
              <div className="mobile-menu">
                {currentUser ? (
                  <>
                    <button 
                      className="mobile-menu-item"
                      onClick={() => handleMenuItemClick(onOpenMyDocs)}
                    >
                      <span className="menu-icon">📚</span>
                      <span>My Documents</span>
                    </button>
                    
                    {userProfile?.isAdmin && (
                      <button 
                        className="mobile-menu-item"
                        onClick={() => handleMenuItemClick(() => setShowAnalytics(true))}
                      >
                        <span className="menu-icon">📊</span>
                        <span>Analytics</span>
                      </button>
                    )}
                    
                    <div className="mobile-menu-item profile-item">
                      <UserProfile />
                    </div>
                  </>
                ) : (
                  <button 
                    className="mobile-menu-item auth-item"
                    onClick={() => handleMenuItemClick(onOpenAuth)}
                  >
                    <span className="menu-icon">🚀</span>
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard 
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </header>
  );
};

export default Header;