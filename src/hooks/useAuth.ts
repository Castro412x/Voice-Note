'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppUser } from '@/types';
import { onAuthChange, signInWithGoogle, signInAsGuest, signOutUser, linkAnonymousToGoogle } from '@/services/auth';

export interface UseAuthReturn {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signInGoogle: () => Promise<void>;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  linkAccount: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((appUser) => {
      setUser(appUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInGoogle = useCallback(async () => {
    setError(null);
    try {
      const appUser = await signInWithGoogle();
      setUser(appUser);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  }, []);

  const signInGuest = useCallback(async () => {
    setError(null);
    try {
      const appUser = await signInAsGuest();
      setUser(appUser);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await signOutUser();
      setUser(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  }, []);

  const linkAccount = useCallback(async () => {
    setError(null);
    try {
      const appUser = await linkAnonymousToGoogle();
      setUser(appUser);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    loading,
    error,
    signInGoogle,
    signInGuest,
    signOut,
    linkAccount,
    clearError,
  };
}
