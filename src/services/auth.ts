import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInAnonymously,
  linkWithPopup,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { AppUser } from '@/types';

function mapUser(user: User): AppUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
  };
}

export function onAuthChange(callback: (user: AppUser | null) => void): () => void {
  const auth = getFirebaseAuth();
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback(mapUser(firebaseUser));
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Auth state change error:', error);
    callback(null);
  });
  return unsubscribe;
}

export async function signInWithGoogle(): Promise<AppUser> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return mapUser(result.user);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled. Please try again.');
      }
      if (firebaseError.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked. Please allow pop-ups for this site.');
      }
    }
    throw new Error('Failed to sign in with Google. Please try again.');
  }
}

export async function signInAsGuest(): Promise<AppUser> {
  const auth = getFirebaseAuth();
  try {
    const result = await signInAnonymously(auth);
    return mapUser(result.user);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/operation-not-allowed') {
        throw new Error('Anonymous sign-in is not enabled. Please enable it in Firebase Console.');
      }
    }
    throw new Error('Failed to sign in as guest. Please try again.');
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  try {
    await firebaseSignOut(auth);
  } catch {
    throw new Error('Failed to sign out. Please try again.');
  }
}

export async function linkAnonymousToGoogle(): Promise<AppUser> {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.isAnonymous) {
    throw new Error('No anonymous user is currently signed in.');
  }
  const provider = new GoogleAuthProvider();
  try {
    await linkWithPopup(currentUser, provider);
    return mapUser(auth.currentUser!);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        throw new Error('Link cancelled. Please try again.');
      }
      if (firebaseError.code === 'auth/credential-already-in-use') {
        throw new Error('This Google account is already linked to another user.');
      }
      if (firebaseError.code === 'auth/provider-already-linked') {
        throw new Error('This account is already linked to Google.');
      }
    }
    throw new Error('Failed to link account. Please try again.');
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  return user ? mapUser(user) : null;
}
