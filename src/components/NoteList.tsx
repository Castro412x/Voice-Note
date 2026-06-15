'use client';

import { useNotes } from '@/hooks/useNotes';
import { useSearch } from '@/hooks/useSearch';
import { NoteCard } from './NoteCard';
import { SearchBar } from './SearchBar';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { AuthButtons } from './AuthButtons';

export function NoteList() {
  const { user } = useAuth();
  const router = useRouter();
  const { notes, loading, error, createNote, deleteNote, showCountWarning, totalCount } = useNotes();
  const { query, setQuery, filteredNotes, isSearching, clearFilters } = useSearch(notes);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    const note = await createNote();
    if (note) {
      router.push(`/note?id=${note.id}`);
    }
    setCreating(false);
  };

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-100">Welcome to Voice Note</h2>
          <p className="mt-2 text-gray-400">Sign in to start taking notes with voice.</p>
        </div>
        <AuthButtons />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800/50" />
        ))}
      </div>
    );
  }

  const displayNotes = isSearching ? filteredNotes : notes;

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/80 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar query={query} onQueryChange={setQuery} />
          </div>
          {isSearching && (
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Note
          </button>
        </div>
        {showCountWarning && (
          <p className="mt-2 text-xs text-yellow-500">
            You have {totalCount} notes. Search performance may degrade with large note collections.
          </p>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-4 rounded-lg bg-red-900/30 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {displayNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-500">
              {isSearching ? 'No notes match your search' : 'No notes yet'}
            </p>
            {!isSearching && (
              <p className="mt-1 text-sm text-gray-600">
                Click "New Note" to get started
              </p>
            )}
          </div>
        ) : (
          displayNotes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={deleteNote} />
          ))
        )}
      </div>
    </div>
  );
}
