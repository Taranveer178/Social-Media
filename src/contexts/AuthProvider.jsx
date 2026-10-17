import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { DEFAULT_USER_SETTINGS, saveNewUserProfile, syncPublicProfile } from '../services/firebaseData';
import { uploadMedia } from '../services/storage';
import { AuthContext } from './AuthContext';

function createUserProfile(firebaseUser, profile = {}) {
  const emailPrefix = firebaseUser.email ? firebaseUser.email.split('@')[0] : 'vibely_user';
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: profile.name || firebaseUser.displayName || emailPrefix,
    username: profile.username || emailPrefix,
    avatar: profile.avatar || firebaseUser.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.uid)}`,
    bio: profile.bio || '',
    vibe: profile.vibe || '🔥 Focused',
    role: profile.role || 'user',
    settings: profile.settings || DEFAULT_USER_SETTINGS,
    savedMessages: Array.isArray(profile.savedMessages) ? profile.savedMessages : null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    let isInitialAuthState = true;
    let authStateRevision = 0;
    return onAuthStateChanged(auth, async (firebaseUser) => {
      const revision = ++authStateRevision;
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const profileSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (revision !== authStateRevision) return;
        if (profileSnapshot.data()?.status === 'suspended') {
          setUser(null);
          setAuthError('This account has been suspended.');
          await signOut(auth);
          return;
        }
        const profile = createUserProfile(firebaseUser, profileSnapshot.exists() ? profileSnapshot.data() : {});
        setUser(profile);
        await syncPublicProfile(profile);
        if (revision !== authStateRevision) return;
        setAuthError('');
      } catch (error) {
        if (revision !== authStateRevision) return;
        setUser(createUserProfile(firebaseUser));
        setAuthError(`Signed in, but the user profile could not be loaded: ${error.message}`);
      } finally {
        if (revision === authStateRevision && isInitialAuthState) {
          isInitialAuthState = false;
          setIsLoading(false);
        }
      }
    }, (error) => {
      setAuthError(error.message);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async ({ email, username, password }) => {
    setAuthError('');
    const credential = await signInWithEmailAndPassword(auth, email || username, password);
    return createUserProfile(credential.user);
  }, []);

  const register = useCallback(async (formData) => {
    setAuthError('');
    const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
    const name = formData.name || formData.email.split('@')[0];
    const avatar = formData.avatarFile
      ? await uploadMedia(formData.avatarFile)
      : `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(credential.user.uid)}`;
    await updateFirebaseProfile(credential.user, {
      displayName: name,
      photoURL: avatar || null,
    });
    const profile = createUserProfile(credential.user, { ...formData, name, avatar });
    await saveNewUserProfile(profile);
    setUser(profile);
    setIsOnboarding(true);
    return profile;
  }, []);

  const changePassword = useCallback(async (newPassword) => {
    if (!auth.currentUser) throw new Error('You must be signed in to update your password.');
    await updatePassword(auth.currentUser, newPassword);
  }, []);

  const sendPasswordReset = useCallback(async (emailAddress) => {
    const targetEmail = emailAddress || auth.currentUser?.email;
    if (!targetEmail) throw new Error('Provide an email address to reset your password.');
    await sendPasswordResetEmail(auth, targetEmail);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setAuthError('');
    setIsOnboarding(false);
  }, []);

  const value = useMemo(() => ({
    user,
    setUser,
    isLoading,
    authError,
    setAuthError,
    login,
    logout,
    register,
    changePassword,
    sendPasswordReset,
    isOnboarding,
    setIsOnboarding,
  }), [user, isLoading, authError, login, logout, register, changePassword, sendPasswordReset, isOnboarding]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
