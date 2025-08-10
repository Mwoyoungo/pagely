import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ParticleBackground from '../Background/ParticleBackground';
import PDFUpload from '../PDF/PDFUpload';
import './LandingPage.css';

const LandingPage = ({ onDocumentUploaded, onShowAuth }) => {
  const { currentUser } = useAuth();
  const [showUpload, setShowUpload] = useState(false);

  const handleGetStarted = () => {
    if (currentUser) {
      setShowUpload(true);
    } else {
      onShowAuth();
    }
  };

  const handleDocumentUploaded = (docData) => {
    setShowUpload(false);
    onDocumentUploaded(docData);
  };

  if (showUpload) {
    return <PDFUpload onDocumentUploaded={handleDocumentUploaded} />;
  }

  return (
    <div className="landing-page">
      <ParticleBackground />
      
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="logo-container">
              📚
            </div>
            <span className="brand-name">Collab</span>
          </div>
          <div className="nav-links">
            <span className="nav-tagline">
              A universe of collaboration
            </span>
            <button 
              className="auth-button"
              onClick={onShowAuth}
            >
              {currentUser ? 'Dashboard' : 'Sign In'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="hero-container">
          {/* Hero Content */}
          <div className="hero-content">
            <h1 className="hero-title">
              Transform PDF Learning <br />
              <span className="gradient-text">
                with Real-time Collaboration
              </span>
            </h1>
            <p className="hero-description">
              Upload any PDF and turn it into an interactive study session. Highlight, 
              voice-explain, and collaborate with students worldwide in real-time.
            </p>
            
            <div className="creator-credit">
              <p>Created by <strong>Blessing Murauro</strong> - A tool for students by a student</p>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-dot stat-blue"></div>
                <span>Real-time highlighting</span>
              </div>
              <div className="stat-item">
                <div className="stat-dot stat-purple"></div>
                <span>Voice explanations</span>
              </div>
              <div className="stat-item">
                <div className="stat-dot stat-pink"></div>
                <span>Collaborative learning</span>
              </div>
            </div>

            <div className="hero-actions">
              <button className="cta-button" onClick={handleGetStarted}>
                <span>Get Started Free</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Hero Visual - Interactive Cards */}
          <div className="hero-visual">
            <div className="feature-cards">
              {/* Highlighting Card */}
              <div className="feature-card highlight-card">
                <div className="card-header">
                  <div className="card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 19l7-7 3 3-7 7-3-3z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="card-category">Highlighting</span>
                </div>
                <div className="card-content">
                  <h3>Smart Annotations</h3>
                  <p>Highlight text and see real-time collaboration from peers</p>
                  <div className="highlight-demo">
                    <div className="highlight-line active"></div>
                    <div className="highlight-line"></div>
                    <div className="highlight-line"></div>
                  </div>
                </div>
              </div>

              {/* Voice Explanation Card */}
              <div className="feature-card voice-card">
                <div className="card-header">
                  <div className="card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
                      <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="card-category">Voice Notes</span>
                </div>
                <div className="card-content">
                  <h3>Audio Explanations</h3>
                  <p>Record voice explanations for complex topics</p>
                  <div className="voice-demo">
                    <div className="voice-wave">
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                    </div>
                    <span className="voice-duration">0:24</span>
                  </div>
                </div>
              </div>

              {/* Collaboration Card */}
              <div className="feature-card collab-card">
                <div className="card-header">
                  <div className="card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="card-category">Collaboration</span>
                </div>
                <div className="card-content">
                  <h3>Live Study Sessions</h3>
                  <p>Join study sessions with students globally</p>
                  <div className="collab-demo">
                    <div className="user-avatars">
                      <div className="avatar active">A</div>
                      <div className="avatar">B</div>
                      <div className="avatar">C</div>
                      <div className="avatar-more">+5</div>
                    </div>
                    <span className="live-indicator">
                      <span className="live-dot"></span>
                      8 users active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;