import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

export class NotificationService {
  
  // Create notification when voice explanation is added
  static async createVoiceExplanationNotification(docId, highlightId, helperUser, targetUserId) {
    try {
      console.log('🔔 Creating voice explanation notification:', { docId, highlightId, helperUser: helperUser.displayName, targetUserId });
      
      const notificationsRef = collection(db, 'notifications');
      
      await addDoc(notificationsRef, {
        type: 'voice_explanation',
        docId: docId,
        highlightId: highlightId,
        fromUserId: helperUser.uid,
        fromUserName: helperUser.displayName || helperUser.email,
        fromUserAvatar: helperUser.photoURL || null,
        toUserId: targetUserId,
        message: `${helperUser.displayName || helperUser.email} recorded a voice explanation for your highlight`,
        createdAt: serverTimestamp(),
        read: false,
        data: {
          highlightId,
          docId
        }
      });
      
      console.log('✅ Voice explanation notification created');
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Subscribe to notifications for a user
  static subscribeToUserNotifications(userId, callback) {
    try {
      console.log('🔔 Subscribing to notifications for user:', userId);
      
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('toUserId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      return onSnapshot(q, (snapshot) => {
        const notifications = [];
        snapshot.forEach((doc) => {
          notifications.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log('🔔 Notifications updated:', notifications.length, 'unread');
        callback(notifications);
      });
      
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  }

  // Get notification for display
  static formatNotification(notification) {
    switch (notification.type) {
      case 'voice_explanation':
        return {
          ...notification,
          title: '🎵 New Voice Explanation',
          icon: '🎤',
          actionText: 'Listen Now'
        };
      default:
        return {
          ...notification,
          title: 'New Notification',
          icon: '🔔',
          actionText: 'View'
        };
    }
  }

  // Request browser notification permission
  static async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Show browser notification
  static showBrowserNotification(notification) {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id, // Prevents duplicate notifications
        requireInteraction: true
      });

      browserNotification.onclick = () => {
        // Focus the window
        window.focus();
        // Close the notification
        browserNotification.close();
        // Could trigger navigation to the highlight here
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  // Mark a notification as read
  static async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
      console.log('Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      console.log('Marking all notifications as read for user:', userId);
      
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('toUserId', '==', userId),
        where('read', '==', false)
      );
      
      // Get all unread notifications
      const snapshot = await new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            unsubscribe();
            resolve(snapshot);
          },
          (error) => {
            unsubscribe();
            reject(error);
          }
        );
      });
      
      if (snapshot.empty) {
        console.log('No unread notifications to mark');
        return;
      }

      // Batch update all to read
      const batch = writeBatch(db);
      snapshot.forEach((notificationDoc) => {
        batch.update(notificationDoc.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log('All notifications marked as read');
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

export default NotificationService;