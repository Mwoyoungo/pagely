import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

export class DocumentService {
  
  // Upload PDF to Firebase Storage and create document metadata
  static async uploadDocument(file, metadata, user, onProgress) {
    try {
      if (!file || !user) {
        throw new Error('File and user are required');
      }

      // Validate file
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB');
      }

      // Generate unique document ID
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create storage reference
      const storageRef = ref(storage, `documents/${docId}.pdf`);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress tracking
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Upload failed:', error);
            reject(new Error('Failed to upload document'));
          },
          async () => {
            try {
              // Get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Create document metadata in Firestore
              const documentData = {
                id: docId,
                title: metadata.title || file.name,
                fileName: file.name,
                uploadedBy: user.uid,
                uploadedByName: user.displayName || user.email,
                uploadedAt: serverTimestamp(),
                
                // Document access & visibility
                isPublic: true,
                collaborators: [user.uid],
                viewers: [],
                
                // File storage
                pdfUrl: downloadURL,
                thumbnailUrl: null, // TODO: Generate thumbnail
                fileSize: file.size,
                pageCount: 0, // TODO: Extract from PDF
                
                // Collaboration stats
                totalHighlights: 0,
                totalVoiceExplanations: 0,
                activeCollaborators: 1,
                helpRequestsOpen: 0,
                
                // Metadata
                subject: metadata.subject || 'General',
                tags: metadata.tags || [],
                description: metadata.description || '',
                
                // Timestamps
                createdAt: serverTimestamp(),
                lastActivity: serverTimestamp(),
                lastActivityBy: user.uid
              };

              // Save to Firestore documents collection
              const docRef = doc(db, 'documents', docId);
              await setDoc(docRef, documentData);
              
              // Create public feed entry
              await this.createFeedEntry({
                type: 'document_uploaded',
                documentId: docId,
                documentTitle: documentData.title,
                documentThumbnail: documentData.thumbnailUrl,
                userId: user.uid,
                userName: user.displayName || user.email,
                userAvatar: user.photoURL,
                description: 'uploaded a new study document',
                subject: documentData.subject,
                tags: documentData.tags,
                collaborators: 1,
                highlights: 0,
                voiceExplanations: 0
              });

              // Update user's document list
              await this.updateUserDocuments(user.uid, docId);
              
              resolve({
                id: docId,
                ...documentData,
                pdfUrl: downloadURL
              });
            } catch (error) {
              console.error('Failed to save document metadata:', error);
              reject(new Error('Failed to save document'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  // Get document by ID
  static async getDocument(docId) {
    try {
      const docRef = doc(db, 'documents', docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  // Get user's documents
  static async getUserDocuments(userId) {
    try {
      const q = query(
        collection(db, 'documents'),
        where('uploadedBy', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort on client side to avoid index requirement
      return documents.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bTime - aTime; // Newest first
      });
    } catch (error) {
      console.error('Error fetching user documents:', error);
      throw error;
    }
  }

  // Get public feed documents
  static async getPublicDocuments(limitCount = 20) {
    try {
      const q = query(
        collection(db, 'documents'),
        where('isPublic', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort on client side to avoid index requirement and limit results
      const sortedDocs = documents.sort((a, b) => {
        const aTime = a.lastActivity?.toDate ? a.lastActivity.toDate() : new Date(a.lastActivity);
        const bTime = b.lastActivity?.toDate ? b.lastActivity.toDate() : new Date(b.lastActivity);
        return bTime - aTime; // Most recent activity first
      });
      
      return sortedDocs.slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching public documents:', error);
      throw error;
    }
  }

  // Subscribe to real-time document updates
  static subscribeToDocument(docId, callback) {
    const docRef = doc(db, 'documents', docId);
    return onSnapshot(docRef, callback);
  }

  // Subscribe to public feed
  static subscribeToPublicFeed(callback) {
    const q = query(
      collection(db, 'publicFeed'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return onSnapshot(q, callback);
  }

  // Join document as collaborator
  static async joinDocument(docId, userId) {
    try {
      const docRef = doc(db, 'documents', docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const docData = docSnap.data();
      
      // Check if already a collaborator
      if (docData.collaborators.includes(userId)) {
        return; // Already a collaborator
      }
      
      // Add to collaborators array
      await updateDoc(docRef, {
        collaborators: [...docData.collaborators, userId],
        activeCollaborators: increment(1),
        lastActivity: serverTimestamp(),
        lastActivityBy: userId
      });
      
    } catch (error) {
      console.error('Error joining document:', error);
      throw error;
    }
  }

  // Create public feed entry
  static async createFeedEntry(feedData) {
    try {
      const feedEntry = {
        ...feedData,
        createdAt: serverTimestamp(),
        isVisible: true
      };
      
      await addDoc(collection(db, 'publicFeed'), feedEntry);
    } catch (error) {
      console.error('Error creating feed entry:', error);
      // Don't throw - feed entry failure shouldn't block document upload
    }
  }

  // Update user's document list
  static async updateUserDocuments(userId, docId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const myDocuments = userData.myDocuments || [];
        
        if (!myDocuments.includes(docId)) {
          await updateDoc(userRef, {
            myDocuments: [...myDocuments, docId],
            documentsUploaded: increment(1),
            lastActive: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error updating user documents:', error);
      // Don't throw - user update failure shouldn't block document upload
    }
  }

  // Delete document
  static async deleteDocument(docId, userId) {
    try {
      const docRef = doc(db, 'documents', docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const docData = docSnap.data();
      
      // Check if user owns the document
      if (docData.uploadedBy !== userId) {
        throw new Error('Only document owner can delete');
      }
      
      // Delete file from storage
      const storageRef = ref(storage, `documents/${docId}.pdf`);
      await deleteObject(storageRef);
      
      // Delete document metadata
      await deleteDoc(docRef);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Search documents
  static async searchDocuments(searchTerm, subject = null) {
    try {
      // Start with basic public documents query
      const q = query(
        collection(db, 'documents'),
        where('isPublic', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        const docData = { id: doc.id, ...doc.data() };
        
        // Apply subject filter
        if (subject && docData.subject !== subject) {
          return;
        }
        
        // Apply search term filter
        if (!searchTerm || 
            docData.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            docData.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            docData.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
          documents.push(docData);
        }
      });
      
      // Sort on client side
      return documents.sort((a, b) => {
        const aTime = a.lastActivity?.toDate ? a.lastActivity.toDate() : new Date(a.lastActivity);
        const bTime = b.lastActivity?.toDate ? b.lastActivity.toDate() : new Date(b.lastActivity);
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }
}

export default DocumentService;