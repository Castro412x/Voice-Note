'use client';

interface TranscriptViewProps {
  transcript: string | null;
  status: 'none' | 'processing' | 'completed';
}

export function TranscriptView({ transcript, status }: TranscriptViewProps) {
  if (status === 'none' && !transcript) return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
      <div className="mb-2 flex items-center gap-2">
        <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
        <span className="text-xs font-medium text-indigo-400">Transcript</span>
        {status === 'processing' && (
          <span className="flex items-center gap-1 rounded-full bg-yellow-900/50 px-2 py-0.5 text-xs text-yellow-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
            Processing
          </span>
        )}
      </div>

      {status === 'processing' && !transcript ? (
        <div className="flex items-center gap-2 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-sm text-gray-400">Generating accurate transcript...</span>
        </div>
      ) : transcript ? (
        <p className="whitespace-pre-wrap text-sm text-gray-300">{transcript}</p>
      ) : null}
    </div>
  );
}
