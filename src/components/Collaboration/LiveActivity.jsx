import { useState, useEffect } from 'react';
import './LiveActivity.css';

const LiveActivity = ({ activities, isVisible }) => {
  const [displayedActivities, setDisplayedActivities] = useState([]);

  useEffect(() => {
    // Only show recent activities (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentActivities = activities
      .filter(activity => new Date(activity.timestamp) > fiveMinutesAgo)
      .slice(0, 5); // Show max 5 activities

    setDisplayedActivities(recentActivities);
  }, [activities]);

  if (!isVisible || displayedActivities.length === 0) {
    return null;
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_joined': return '👋';
      case 'new_highlight': return '✨';
      case 'help_request': return '🤚';
      case 'explanation_added': return '🎥';
      case 'voice_note': return '🎵';
      default: return '💬';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_joined': return '#4ecdc4';
      case 'new_highlight': return '#ffeb3b';
      case 'help_request': return '#ff6b6b';
      case 'explanation_added': return '#4caf50';
      case 'voice_note': return '#9c27b0';
      default: return '#666';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} min ago`;
  };

  return (
    <div className="live-activity-feed">
      <h4>Live Activity</h4>
      <div className="activity-list">
        {displayedActivities.map(activity => (
          <div 
            key={activity.id} 
            className="activity-item"
            style={{ borderLeftColor: getActivityColor(activity.type) }}
          >
            <div className="activity-icon">
              {getActivityIcon(activity.type)}
            </div>
            <div className="activity-content">
              <div className="activity-user">
                <span 
                  className="user-avatar-small"
                  style={{ backgroundColor: activity.user.color }}
                >
                  {activity.user.avatar}
                </span>
                <span className="user-name">{activity.user.name}</span>
              </div>
              <div className="activity-message">
                {activity.type === 'new_highlight' && (
                  <>highlighted text on page {activity.page}</>
                )}
                {activity.type === 'help_request' && (
                  <>requested help with a concept</>
                )}
                {activity.type === 'explanation_added' && (
                  <>added a video explanation</>
                )}
                {activity.type === 'voice_note' && (
                  <>left a voice note</>
                )}
                {activity.type === 'user_joined' && (
                  <>joined the study session</>
                )}
              </div>
              <div className="activity-time">
                {formatTimeAgo(activity.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveActivity;