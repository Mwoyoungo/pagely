import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationService from '../../services/notificationService';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { currentUser } = useAuth();
  const { showNotification } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    // Request browser notification permission
    NotificationService.requestNotificationPermission().then(setHasPermission);

    // Subscribe to user notifications
    const unsubscribe = NotificationService.subscribeToUserNotifications(
      currentUser.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        
        // Show browser notifications for new ones
        newNotifications.forEach(notification => {
          const formatted = NotificationService.formatNotification(notification);
          
          // Show in-app notification
          showNotification(formatted.message, 'success');
          
          // Show browser notification
          if (hasPermission) {
            NotificationService.showBrowserNotification(formatted);
          }
        });
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, hasPermission, showNotification]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleNotificationClick = async (notification) => {
    console.log('Notification clicked:', notification);
    
    // Mark this notification as read
    try {
      await NotificationService.markAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
    
    // Could navigate to the highlight or document here
    setIsDropdownOpen(false);
  };

  const handleDropdownToggle = async () => {
    const newIsOpen = !isDropdownOpen;
    setIsDropdownOpen(newIsOpen);
    
    // Mark all notifications as read when opening the dropdown
    if (newIsOpen && notifications.length > 0 && currentUser) {
      try {
        await NotificationService.markAllAsRead(currentUser.uid);
        showNotification('All notifications marked as read', 'success');
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const notificationTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (!currentUser) return null;

  return (
    <div className="notification-center" ref={dropdownRef}>
      <button 
        className="notification-bell"
        onClick={handleDropdownToggle}
        title="Notifications"
      >
        🔔
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </button>

      {isDropdownOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            Notifications
          </div>
          
          {notifications.length === 0 ? (
            <div className="no-notifications">
              No new notifications
            </div>
          ) : (
            notifications.map((notification) => {
              const formatted = NotificationService.formatNotification(notification);
              return (
                <div
                  key={notification.id}
                  className="notification-item"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <span className="notification-icon">{formatted.icon}</span>
                    <div className="notification-text">
                      <div className="notification-title">{formatted.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {getTimeAgo(notification.createdAt)}
                      </div>
                      {formatted.actionText && (
                        <button className="notification-action">
                          {formatted.actionText}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;