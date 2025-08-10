import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import analyticsService from '../../services/analyticsService';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const [analytics, setAnalytics] = useState([]);
  const [stats, setStats] = useState({});
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, timeRange]);

  const loadAnalytics = () => {
    const events = analyticsService.getEvents();
    setAnalytics(events);
    calculateStats(events);
  };

  const calculateStats = (events) => {
    const now = new Date();
    const filtered = events.filter(event => {
      if (timeRange === 'all') return true;
      const eventTime = new Date(event.properties.timestamp);
      const diffHours = (now - eventTime) / (1000 * 60 * 60);
      
      switch (timeRange) {
        case '1h': return diffHours <= 1;
        case '24h': return diffHours <= 24;
        case '7d': return diffHours <= 168;
        default: return true;
      }
    });

    const stats = {
      totalEvents: filtered.length,
      uniqueUsers: new Set(filtered.map(e => e.properties.userId).filter(Boolean)).size,
      pageViews: filtered.filter(e => e.name === 'page_view').length,
      documentUploads: filtered.filter(e => e.name === 'document_upload').length,
      highlightsCreated: filtered.filter(e => e.name === 'highlight_created').length,
      voiceExplanations: filtered.filter(e => e.name === 'voice_explanation').length,
      helpRequests: filtered.filter(e => e.name === 'help_request').length,
      userSignups: filtered.filter(e => e.name === 'user_signup').length,
      userSignins: filtered.filter(e => e.name === 'user_signin').length,
      errors: filtered.filter(e => e.name === 'error').length
    };

    setStats(stats);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventIcon = (eventName) => {
    const icons = {
      'page_view': '👁️',
      'document_upload': '📄',
      'document_open': '📖',
      'highlight_created': '✏️',
      'voice_explanation': '🎤',
      'help_request': '❓',
      'user_signup': '👤',
      'user_signin': '🔑',
      'feature_usage': '⚡',
      'error': '❌'
    };
    return icons[eventName] || '📊';
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Only show for admin users
  if (!userProfile?.isAdmin) {
    return null;
  }

  if (!isOpen) return null;

  return (
    <div className="analytics-overlay" onClick={handleOverlayClick}>
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h2>📊 Analytics Dashboard</h2>
          <div className="analytics-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-select"
            >
              <option value="all">All Time</option>
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        </div>

        <div className="analytics-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.totalEvents || 0}</div>
            <div className="stat-label">Total Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.uniqueUsers || 0}</div>
            <div className="stat-label">Unique Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pageViews || 0}</div>
            <div className="stat-label">Page Views</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.documentUploads || 0}</div>
            <div className="stat-label">Documents</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.highlightsCreated || 0}</div>
            <div className="stat-label">Highlights</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.voiceExplanations || 0}</div>
            <div className="stat-label">Voice Notes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.helpRequests || 0}</div>
            <div className="stat-label">Help Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.userSignups || 0}</div>
            <div className="stat-label">Signups</div>
          </div>
        </div>

        <div className="analytics-events">
          <div className="events-header">
            <h3>Recent Events</h3>
            <button 
              onClick={() => {
                analyticsService.clearEvents();
                loadAnalytics();
              }}
              className="clear-btn"
            >
              Clear All
            </button>
          </div>
          <div className="events-list">
            {analytics.slice(-50).reverse().map((event, index) => (
              <div key={index} className="event-item">
                <div className="event-icon">{getEventIcon(event.name)}</div>
                <div className="event-details">
                  <div className="event-name">{event.name.replace(/_/g, ' ')}</div>
                  <div className="event-time">{formatTimestamp(event.properties.timestamp)}</div>
                </div>
                <div className="event-properties">
                  {Object.entries(event.properties)
                    .filter(([key]) => !['timestamp', 'url', 'userAgent', 'sessionId'].includes(key))
                    .map(([key, value]) => (
                      <span key={key} className="property">
                        {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {stats.errors > 0 && (
          <div className="analytics-errors">
            <h3>⚠️ Errors ({stats.errors})</h3>
            <div className="errors-list">
              {analytics
                .filter(e => e.name === 'error')
                .slice(-10)
                .map((error, index) => (
                  <div key={index} className="error-item">
                    <div className="error-message">{error.properties.message}</div>
                    <div className="error-context">{error.properties.context}</div>
                    <div className="error-time">{formatTimestamp(error.properties.timestamp)}</div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;