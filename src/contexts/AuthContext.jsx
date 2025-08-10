import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(user, { displayName });
    
    // Create user profile in Firestore
    await createUserProfile(user, { displayName });
    
    return user;
  };

  // Sign in with email and password
  const signin = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const signinWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    
    // Create or update user profile
    await createUserProfile(user);
    
    return user;
  };

  // Sign out
  const logout = () => {
    return signOut(auth);
  };

  // Create user profile in Firestore
  const createUserProfile = async (user, additionalData = {}) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    // If user document doesn't exist, create it
    if (!userSnap.exists()) {
      const userData = {
        id: user.uid,
        name: additionalData.displayName || user.displayName || 'Anonymous User',
        email: user.email,
        avatar: user.photoURL || null,
        university: '', // To be filled by user
        major: '',
        yearLevel: '',
        
        // User stats
        documentsUploaded: 0,
        highlightsCreated: 0,
        helpProvided: 0,
        helpReceived: 0,
        totalStudyHours: 0,
        
        // User roles
        isAdmin: false,
        isTeacher: false,
        
        // Personal documents
        myDocuments: [],
        recentDocuments: [],
        favoriteDocuments: [],
        collaboratingOn: [],
        
        // Learning preferences
        subjects: [],
        learningGoals: [],
        
        // Account info
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        isOnline: true,
        
        // Notification settings
        notifications: {
          helpRequests: true,
          newCollaborators: true,
          voiceExplanations: true,
          documentUpdates: false
        },
        
        ...additionalData
      };

      await setDoc(userRef, userData);
      setUserProfile(userData);
    } else {
      // Update last active and online status
      await setDoc(userRef, {
        lastActive: serverTimestamp(),
        isOnline: true
      }, { merge: true });
      
      setUserProfile(userSnap.data());
    }
  };

  // Get user profile
  const getUserProfile = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) return;
    
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, updates, { merge: true });
    
    // Update local state
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Load user profile
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Update online status on window focus/blur
  useEffect(() => {
    if (!currentUser) return;

    const handleFocus = () => {
      updateUserProfile({ isOnline: true, lastActive: serverTimestamp() });
    };

    const handleBlur = () => {
      updateUserProfile({ isOnline: false });
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [currentUser]);

  const value = {
    currentUser,
    userProfile,
    signup,
    signin,
    signinWithGoogle,
    logout,
    updateUserProfile,
    getUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;