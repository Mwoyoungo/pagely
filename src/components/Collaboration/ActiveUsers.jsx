import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ActiveUsersService from '../../services/activeUsersService';
import './ActiveUsers.css';

const ActiveUsers = ({ document: pdfDocument }) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!pdfDocument?.id || !currentUser) return;

    // Join document session
    ActiveUsersService.joinDocument(pdfDocument.id, currentUser);

    // Subscribe to active users
    const unsubscribe = ActiveUsersService.subscribeToActiveUsers(
      pdfDocument.id,
      (users) => {
        setActiveUsers(users);
        setLoading(false);
      }
    );

    // Update activity every 30 seconds (heartbeat)
    const activityInterval = setInterval(() => {
      ActiveUsersService.updateActivity(pdfDocument.id, currentUser.uid);
    }, 30000);

    // Cleanup on unmount
    return () => {
      ActiveUsersService.leaveDocument(pdfDocument.id, currentUser.uid);
      clearInterval(activityInterval);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [pdfDocument?.id, currentUser]);

  const recordingUsers = ActiveUsersService.getRecordingUsers(activeUsers);

  if (loading) {
    return (
      <div className="active-users">
        <div className="active-users-loading">
          <div className="spinner-small"></div>
          <span>Loading collaborators...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="active-users">
      {/* Recording indicator */}
      {recordingUsers.length > 0 && (
        <div className="recording-indicator">
          <div className="recording-animation">
            <div className="recording-dot"></div>
            <div className="recording-dot"></div>
            <div className="recording-dot"></div>
          </div>
          <span>
            {recordingUsers[0].displayName} is recording...
          </span>
        </div>
      )}

      {/* Active users avatars */}
      <div className="active-users-list">
        <span className="active-users-count">{activeUsers.length}</span>
        {activeUsers.map((user) => (
          <div
            key={user.id}
            className={`active-user-avatar ${user.isRecording ? 'recording' : ''}`}
            title={`${user.displayName} ${user.isRecording ? '(Recording...)' : ''}`}
          >
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName}
                className="user-photo"
              />
            ) : (
              <div className="user-initials">
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            {user.isRecording && (
              <div className="recording-badge">
                🎤
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveUsers;