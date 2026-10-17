import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyCq6hcgGezvfD8JaRDc_fYfVYVw4T1wMSs',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'vibely-1d289.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'vibely-1d289',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'vibely-1d289.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '660373637357',
  appId: env.VITE_FIREBASE_APP_ID || '1:660373637357:web:ed634904355b9d71b4e4',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
