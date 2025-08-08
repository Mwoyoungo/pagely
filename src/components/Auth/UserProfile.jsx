import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './Auth.css';

const UserProfile = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { showNotification } = useNotifications();

  const handleLogout = async () => {
    try {
      await logout();
      showNotification('Signed out successfully', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Failed to sign out', 'error');
    }
  };

  if (!currentUser || !userProfile) return null;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="user-profile">
      <div className="user-avatar">
        {userProfile.avatar ? (
          <img 
            src={userProfile.avatar} 
            alt={userProfile.name}
            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
          />
        ) : (
          getInitials(userProfile.name || 'User')
        )}
      </div>
      
      <div className="user-info">
        <div className="user-name">{userProfile.name}</div>
        <div className="user-email">{userProfile.email}</div>
      </div>
      
      <button 
        className="logout-btn"
        onClick={handleLogout}
        title="Sign out"
      >
        Sign Out
      </button>
    </div>
  );
};

export default UserProfile;