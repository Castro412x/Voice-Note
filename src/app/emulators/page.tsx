'use client';

import { useState } from 'react';
import { connectEmulators } from '@/services/firebase';

export default function EmulatorsPage() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = () => {
    try {
      connectEmulators();
      setConnected(true);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to connect to emulators');
      }
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-md rounded-xl border border-gray-700 bg-gray-800 p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-100">Firebase Emulators</h2>
        <p className="mt-2 text-sm text-gray-400">
          Connect to local Firebase emulators for development.
        </p>

        {connected ? (
          <div className="mt-4 rounded-lg bg-green-900/30 p-3 text-sm text-green-400">
            Connected to local emulators (localhost:9099, 8080, 9199)
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Connect to Emulators
          </button>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        <div className="mt-4 text-left text-xs text-gray-500">
          <p className="mb-1 font-medium">Emulator Ports:</p>
          <ul className="space-y-0.5">
            <li>Auth: localhost:9099</li>
            <li>Firestore: localhost:8080</li>
            <li>Storage: localhost:9199</li>
            <li>Functions: localhost:5001</li>
            <li>Emulator UI: localhost:4000</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
