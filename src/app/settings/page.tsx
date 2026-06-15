'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      if (indexedDB && indexedDB.databases) {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases
            .filter((db) => db.name && db.name.includes('firebase'))
            .map((db) => indexedDB.deleteDatabase(db.name!)),
        );
      }

      toast.success('Cache cleared. Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error('Failed to clear cache');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="text-xl font-semibold text-gray-100">Settings</h2>

      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
          <h3 className="text-sm font-medium text-gray-200">Offline Cache</h3>
          <p className="mt-1 text-xs text-gray-500">
            Clear locally cached data. This will reload the app.
          </p>
          <button
            onClick={handleClearCache}
            disabled={clearing}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {clearing ? 'Clearing...' : 'Clear Cache & Reload'}
          </button>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
          <h3 className="text-sm font-medium text-gray-200">App Info</h3>
          <ul className="mt-2 space-y-1 text-xs text-gray-500">
            <li>Version: 1.0.0</li>
            <li>Storage: Audio files in Firebase Storage</li>
            <li>Database: Firestore with offline persistence</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
