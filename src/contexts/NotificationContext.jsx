import { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      showNotification, 
      removeNotification 
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return '#4ecdc4';
      case 'error': return '#ff6b6b';
      case 'warning': return '#ffd93d';
      default: return '#1da1f2';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '100px',
      right: '20px',
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          onClick={() => removeNotification(notification.id)}
          style={{
            background: getTypeColor(notification.type),
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};

export default NotificationProvider;