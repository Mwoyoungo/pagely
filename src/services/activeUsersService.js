import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export class ActiveUsersService {
  
  // Join document session - mark user as active
  static async joinDocument(docId, user) {
    try {
      console.log('👥 User joining document session:', { docId, userId: user.uid });
      
      const activeUserRef = doc(db, 'documents', docId, 'activeUsers', user.uid);
      
      await setDoc(activeUserRef, {
        uid: user.uid,
        displayName: user.displayName || user.email,
        email: user.email,
        photoURL: user.photoURL || null,
        joinedAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        isRecording: false
      });
      
      console.log('✅ User joined document session');
    } catch (error) {
      console.error('Error joining document:', error);
      throw error;
    }
  }

  // Leave document session - remove user from active list
  static async leaveDocument(docId, userId) {
    try {
      console.log('👋 User leaving document session:', { docId, userId });
      
      const activeUserRef = doc(db, 'documents', docId, 'activeUsers', userId);
      await deleteDoc(activeUserRef);
      
      console.log('✅ User left document session');
    } catch (error) {
      console.error('Error leaving document:', error);
      // Don't throw - user might be navigating away
    }
  }

  // Update user recording status
  static async setRecordingStatus(docId, userId, isRecording) {
    try {
      console.log('🎤 Updating recording status:', { docId, userId, isRecording });
      
      const activeUserRef = doc(db, 'documents', docId, 'activeUsers', userId);
      
      await setDoc(activeUserRef, {
        isRecording,
        lastActivity: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Recording status updated');
    } catch (error) {
      console.error('Error updating recording status:', error);
      throw error;
    }
  }

  // Subscribe to active users for a document
  static subscribeToActiveUsers(docId, callback) {
    try {
      console.log('👥 Subscribing to active users for document:', docId);
      
      const activeUsersRef = collection(db, 'documents', docId, 'activeUsers');
      
      return onSnapshot(activeUsersRef, (snapshot) => {
        const activeUsers = [];
        snapshot.forEach((doc) => {
          activeUsers.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log('👥 Active users updated:', activeUsers.length, 'users');
        callback(activeUsers);
      });
      
    } catch (error) {
      console.error('Error subscribing to active users:', error);
      throw error;
    }
  }

  // Update user activity timestamp (heartbeat)
  static async updateActivity(docId, userId) {
    try {
      const activeUserRef = doc(db, 'documents', docId, 'activeUsers', userId);
      
      await setDoc(activeUserRef, {
        lastActivity: serverTimestamp()
      }, { merge: true });
      
    } catch (error) {
      console.error('Error updating activity:', error);
      // Don't throw - this is a background operation
    }
  }

  // Get recording users (for animation)
  static getRecordingUsers(activeUsers) {
    return activeUsers.filter(user => user.isRecording);
  }
}

export default ActiveUsersService;