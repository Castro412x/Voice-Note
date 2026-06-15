'use client';

import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useEffect, useState } from 'react';
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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return <div className="h-14" />;
  }

  if (!isSupported) {
    return (
      <div className="rounded-lg bg-yellow-900/20 border border-yellow-700/30 p-3 text-center text-sm text-yellow-400">
        <span className="font-medium">Recording unavailable:</span> Use Chrome or Edge with HTTPS to enable voice recording.
      </div>
    );
  }

  const isRecording = state === 'recording';
  const isBusy = state === 'requesting' || state === 'stopping' || state === 'uploading' || state === 'processing';

  return (
    <div className="rounded-lg bg-gray-800/80 border border-gray-700/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-red-600" />
              </span>
              <span className="text-sm font-mono tabular-nums text-red-400">
                {formatDuration(duration)}
              </span>
            </div>
          )}

          {state === 'uploading' && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-300"
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

          {state === 'idle' && (
            <span className="text-sm text-gray-400">
              Record audio for this note
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isRecording && (
            <button
              onClick={() => stopRecording()}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-500 hover:shadow-lg hover:shadow-red-900/50 active:scale-95"
            >
              <div className="h-3 w-3 rounded-sm bg-white" />
              Stop Recording
            </button>
          )}
          {!isRecording && !isBusy && (
            <button
              onClick={() => startRecording(noteId)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-900/50 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              Record
            </button>
          )}
        </div>
      </div>

      {isRecording && liveTranscript && (
        <div className="mt-3 rounded-lg bg-gray-900/50 p-3 border border-gray-700/30">
          <p className="text-xs text-gray-500 mb-1">Live transcript (not saved)</p>
          <p className="text-sm text-gray-300 italic">{liveTranscript}</p>
        </div>
      )}
    </div>
  );
}
