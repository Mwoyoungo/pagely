import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqfZCkftiYPHwD2BFtN7BlzyTFHwn8Pdo",
  authDomain: "kolab-7eac7.firebaseapp.com",
  projectId: "kolab-7eac7",
  storageBucket: "kolab-7eac7.firebasestorage.app",
  messagingSenderId: "162153772326",
  appId: "1:162153772326:web:64a647d66221326726bde7",
  measurementId: "G-1BXJKB14RM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Add CORS-friendly configuration
const storageConfig = {
  timeout: 120000, // 2 minutes timeout
  maxRetries: 3
};

// Development mode - connect to emulators (optional)
// Uncomment the following if you want to use Firebase emulators for development
// if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     connectAuthEmulator(auth, 'http://localhost:9099');
//     connectStorageEmulator(storage, 'localhost', 9199);
//     console.log('Connected to Firebase emulators');
//   } catch (error) {
//     console.log('Emulators already connected or not available');
//   }
// }

export default app;