'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import { NoteEditor } from '@/components/NoteEditor';
import { Note } from '@/types';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getNote, updateNote, deleteNote } = useNotes();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const noteId = params.id as string;

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getNote(noteId);
      if (cancelled) return;
      if (result) {
        setNote(result);
      } else {
        setError('Note not found');
      }
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user, noteId, getNote, router]);

  const handleSave = async (
    id: string,
    data: { title: string; content: string; tags: string[] },
  ) => {
    await updateNote(id, data);
  };

  const handleDelete = async (id: string) => {
    await deleteNote(id);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-gray-400">{error || 'Note not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
        >
          Back to notes
        </button>
      </div>
    );
  }

  return (
    <NoteEditor
      note={note}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}
