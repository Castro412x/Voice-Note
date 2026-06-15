'use client';

import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

interface RecordButtonProps {
  noteId: string;
}

export function RecordButton({ noteId }: RecordButtonProps) {
  const {
    state,
    duration,
    uploadProgress,
    liveTranscript,
    error,
    startRecording,
    stopRecording,
    clearError,
    isSupported,
  } = useVoiceRecorder();

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <div className="rounded-lg bg-gray-800/50 p-3 text-center text-sm text-gray-500">
        Voice recording is not supported in this browser. Please use Chrome or Edge.
      </div>
    );
  }

  const isRecording = state === 'recording';
  const isBusy = state === 'requesting' || state === 'stopping' || state === 'uploading' || state === 'processing';

  return (
    <div className="rounded-lg bg-gray-800/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 animate-pulse rounded-full bg-red-500"
                    style={{
                      height: `${12 + Math.sin(Date.now() / 200 + i) * 8}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm font-mono text-red-400">
                {formatDuration(duration)}
              </span>
            </div>
          )}

          {state === 'uploading' && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{uploadProgress}%</span>
            </div>
          )}

          {state === 'processing' && (
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing transcript...
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isRecording && (
            <button
              onClick={() => stopRecording()}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              <div className="h-3 w-3 rounded-sm bg-white" />
              Stop
            </button>
          )}
          {!isRecording && !isBusy && (
            <button
              onClick={() => startRecording(noteId)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              <div className="h-3 w-3 rounded-full bg-white" />
              Record
            </button>
          )}
        </div>
      </div>

      {isRecording && liveTranscript && (
        <div className="mt-3 rounded-lg bg-gray-900/50 p-3">
          <p className="text-xs text-gray-500 mb-1">Live transcript (not saved)</p>
          <p className="text-sm text-gray-300 italic">{liveTranscript}</p>
        </div>
      )}
    </div>
  );
}
