import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

export class ClassService {
  
  // Submit a class enrollment request
  static async submitClassRequest(requestData) {
    try {
      const classRequestsRef = collection(db, 'classRequests');
      
      const requestDoc = {
        ...requestData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'pending' // pending, contacted, enrolled, declined
      };

      const docRef = await addDoc(classRequestsRef, requestDoc);
      console.log('Class request submitted with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...requestDoc
      };
    } catch (error) {
      console.error('Error submitting class request:', error);
      throw error;
    }
  }

  // Get all class requests for admin view
  static async getAllClassRequests() {
    try {
      const classRequestsRef = collection(db, 'classRequests');
      const q = query(classRequestsRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return requests;
    } catch (error) {
      console.error('Error fetching class requests:', error);
      throw error;
    }
  }

  // Get class requests for a specific document
  static async getClassRequestsForDocument(documentId) {
    try {
      const classRequestsRef = collection(db, 'classRequests');
      const q = query(
        classRequestsRef, 
        where('documentId', '==', documentId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return requests;
    } catch (error) {
      console.error('Error fetching document class requests:', error);
      throw error;
    }
  }

  // Get class requests for a specific user
  static async getUserClassRequests(userId) {
    try {
      const classRequestsRef = collection(db, 'classRequests');
      const q = query(
        classRequestsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return requests;
    } catch (error) {
      console.error('Error fetching user class requests:', error);
      throw error;
    }
  }

  // Check if user already made a request for this document
  static async hasUserRequestedClass(userId, documentId) {
    try {
      const classRequestsRef = collection(db, 'classRequests');
      const q = query(
        classRequestsRef, 
        where('userId', '==', userId),
        where('documentId', '==', documentId)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user class request:', error);
      return false;
    }
  }
}

export default ClassService;