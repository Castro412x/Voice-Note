'use client';

import { Note } from '@/types';
import { formatTimestamp, truncate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => Promise<void>;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this note?')) return;
    setDeleting(true);
    await onDelete(note.id);
    setDeleting(false);
    toast.success('Note deleted');
  };

  return (
    <div
      onClick={() => router.push(`/notes/${note.id}`)}
      className="group cursor-pointer rounded-xl border border-gray-700/50 bg-gray-800/50 p-4 transition-all hover:border-gray-600 hover:bg-gray-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-100">
            {note.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {formatTimestamp(note.updatedAt.seconds)}
          </p>
        </div>
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {note.transcriptStatus === 'processing' && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-900/50 px-2 py-0.5 text-xs text-yellow-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
              Processing
            </span>
          )}
          {note.audioUrl && (
            <span className="rounded-full bg-indigo-900/50 px-2 py-0.5 text-xs text-indigo-400">
              Audio
            </span>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-900/30 hover:text-red-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {(note.content || note.transcript) && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-400">
          {truncate(note.content || note.transcript || '', 150)}
        </p>
      )}

      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-700/50 px-2 py-0.5 text-xs text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
