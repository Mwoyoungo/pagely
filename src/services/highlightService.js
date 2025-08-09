import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

export class HighlightService {
  
  // Create a new highlight
  static async createHighlight(docId, highlightData, user) {
    try {
      if (!docId || !highlightData || !user) {
        throw new Error('Document ID, highlight data, and user are required');
      }

      const highlight = {
        text: highlightData.text,
        pageNumber: highlightData.pageNumber,
        position: highlightData.position,
        color: highlightData.color || '#ffeb3b',
        
        // Attribution
        createdBy: user.uid,
        createdByName: user.displayName || user.email,
        createdByAvatar: user.photoURL || null,
        createdAt: serverTimestamp(),
        
        // Help system
        needsHelp: highlightData.needsHelp || false,
        helpRequest: highlightData.helpRequest || null,
        
        // Voice explanations
        voiceExplanations: [],
        
        // Engagement
        viewCount: 0,
        lastViewed: serverTimestamp()
      };

      // Add to highlights subcollection
      const highlightsRef = collection(db, 'documents', docId, 'highlights');
      const docRef = await addDoc(highlightsRef, highlight);
      
      // Update document stats
      await this.updateDocumentStats(docId, user.uid);
      
      return {
        id: docRef.id,
        ...highlight
      };
    } catch (error) {
      console.error('Error creating highlight:', error);
      throw error;
    }
  }

  // Get all highlights for a document
  static async getDocumentHighlights(docId) {
    try {
      const highlightsRef = collection(db, 'documents', docId, 'highlights');
      const q = query(highlightsRef, orderBy('createdAt', 'asc'));
      
      const querySnapshot = await getDocs(q);
      const highlights = [];
      
      querySnapshot.forEach((doc) => {
        highlights.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return highlights;
    } catch (error) {
      console.error('Error fetching highlights:', error);
      throw error;
    }
  }

  // Subscribe to real-time highlights
  static subscribeToHighlights(docId, callback) {
    try {
      const highlightsRef = collection(db, 'documents', docId, 'highlights');
      const q = query(highlightsRef, orderBy('createdAt', 'asc'));
      
      return onSnapshot(q, (snapshot) => {
        const highlights = [];
        snapshot.forEach((doc) => {
          highlights.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(highlights);
      });
    } catch (error) {
      console.error('Error subscribing to highlights:', error);
      throw error;
    }
  }

  // Update highlight with help request
  static async requestHelp(docId, highlightId, helpRequest, user) {
    try {
      const highlightRef = doc(db, 'documents', docId, 'highlights', highlightId);
      
      await updateDoc(highlightRef, {
        needsHelp: true,
        helpRequest: {
          ...helpRequest,
          requestedAt: serverTimestamp(),
          requestedBy: user.uid,
          requestedByName: user.displayName || user.email
        }
      });

      // Update document help request count
      const docRef = doc(db, 'documents', docId);
      await updateDoc(docRef, {
        helpRequestsOpen: increment(1),
        lastActivity: serverTimestamp(),
        lastActivityBy: user.uid
      });

    } catch (error) {
      console.error('Error requesting help:', error);
      throw error;
    }
  }

  // Add voice explanation to highlight
  static async addVoiceExplanation(docId, highlightId, audioBlob, explanationText, user, onProgress) {
    try {
      if (!audioBlob || !user) {
        throw new Error('Audio blob and user are required');
      }

      // Generate unique audio ID
      const audioId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Upload audio to Firebase Storage
      const audioRef = ref(storage, `audio/${audioId}.webm`);
      const uploadTask = uploadBytesResumable(audioRef, audioBlob);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Audio upload failed:', error);
            reject(new Error('Failed to upload voice explanation'));
          },
          async () => {
            try {
              // Get download URL
              const audioUrl = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Create voice explanation object
              const voiceExplanation = {
                id: audioId,
                audioUrl: audioUrl,
                duration: 0, // TODO: Calculate from audio
                fileSize: audioBlob.size,
                recordedBy: user.uid,
                recordedByName: user.displayName || user.email,
                recordedByAvatar: user.photoURL || null,
                recordedAt: serverTimestamp(),
                transcript: explanationText || '', // Future: AI transcription
                likes: 0,
                isHelpful: false
              };

              // Update highlight with voice explanation
              const highlightRef = doc(db, 'documents', docId, 'highlights', highlightId);
              const highlightSnap = await getDoc(highlightRef);
              
              if (!highlightSnap.exists()) {
                throw new Error('Highlight not found');
              }
              
              const highlightData = highlightSnap.data();
              const updatedExplanations = [
                ...(highlightData.voiceExplanations || []),
                voiceExplanation
              ];

              await updateDoc(highlightRef, {
                voiceExplanations: updatedExplanations,
                needsHelp: false, // Mark as helped
                helpRequest: null // Clear help request
              });

              // Update document stats
              const docRef = doc(db, 'documents', docId);
              await updateDoc(docRef, {
                totalVoiceExplanations: increment(1),
                helpRequestsOpen: increment(-1),
                lastActivity: serverTimestamp(),
                lastActivityBy: user.uid
              });

              resolve(voiceExplanation);
            } catch (error) {
              console.error('Failed to save voice explanation:', error);
              reject(new Error('Failed to save voice explanation'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Voice explanation error:', error);
      throw error;
    }
  }

  // Delete highlight
  static async deleteHighlight(docId, highlightId, userId) {
    try {
      const highlightRef = doc(db, 'documents', docId, 'highlights', highlightId);
      const highlightSnap = await getDoc(highlightRef);
      
      if (!highlightSnap.exists()) {
        throw new Error('Highlight not found');
      }
      
      const highlightData = highlightSnap.data();
      
      // Check if user owns the highlight
      if (highlightData.createdBy !== userId) {
        throw new Error('Only highlight creator can delete');
      }
      
      // Delete highlight
      await deleteDoc(highlightRef);
      
      // Update document stats
      const docRef = doc(db, 'documents', docId);
      await updateDoc(docRef, {
        totalHighlights: increment(-1),
        lastActivity: serverTimestamp(),
        lastActivityBy: userId
      });

    } catch (error) {
      console.error('Error deleting highlight:', error);
      throw error;
    }
  }

  // Update document collaboration stats
  static async updateDocumentStats(docId, userId) {
    try {
      const docRef = doc(db, 'documents', docId);
      await updateDoc(docRef, {
        totalHighlights: increment(1),
        lastActivity: serverTimestamp(),
        lastActivityBy: userId
      });
    } catch (error) {
      console.error('Error updating document stats:', error);
      // Don't throw - stats update failure shouldn't block highlight creation
    }
  }

  // Like a voice explanation
  static async likeVoiceExplanation(docId, highlightId, voiceId, userId) {
    try {
      const highlightRef = doc(db, 'documents', docId, 'highlights', highlightId);
      const highlightSnap = await getDoc(highlightRef);
      
      if (!highlightSnap.exists()) {
        throw new Error('Highlight not found');
      }
      
      const highlightData = highlightSnap.data();
      const voiceExplanations = highlightData.voiceExplanations || [];
      
      const updatedExplanations = voiceExplanations.map(voice => {
        if (voice.id === voiceId) {
          return {
            ...voice,
            likes: (voice.likes || 0) + 1,
            isHelpful: true
          };
        }
        return voice;
      });
      
      await updateDoc(highlightRef, {
        voiceExplanations: updatedExplanations
      });

    } catch (error) {
      console.error('Error liking voice explanation:', error);
      throw error;
    }
  }

  // Get highlights that need help
  static async getHelpRequests(docId) {
    try {
      const highlightsRef = collection(db, 'documents', docId, 'highlights');
      const q = query(
        highlightsRef,
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const helpRequests = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.needsHelp) {
          helpRequests.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      return helpRequests;
    } catch (error) {
      console.error('Error fetching help requests:', error);
      throw error;
    }
  }
}

export default HighlightService;