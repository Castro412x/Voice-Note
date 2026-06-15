'use client';

import { useAuth } from '@/hooks/useAuth';

export function UserMenu() {
  const { user, signOut, linkAccount, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-700" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName || 'User'}
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
          {(user.displayName || 'G')[0]}
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-200">
          {user.displayName || (user.isAnonymous ? 'Guest' : 'User')}
        </span>
        {user.isAnonymous && (
          <button
            onClick={linkAccount}
            className="text-left text-xs text-indigo-400 hover:text-indigo-300"
          >
            Link to Google account
          </button>
        )}
      </div>
      <button
        onClick={signOut}
        className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
      >
        Sign out
      </button>
    </div>
  );
}
