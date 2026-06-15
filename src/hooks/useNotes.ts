'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Note, NoteInput } from '@/types';
import {
  createNote as createNoteService,
  updateNote as updateNoteService,
  deleteNote as deleteNoteService,
  getNote as getNoteService,
  subscribeNotes,
  getTotalNoteCount,
} from '@/services/firestore';
import { useAuth } from './useAuth';
import { NOTE_WARN_THRESHOLD } from '@/lib/constants';

export interface UseNotesReturn {
  notes: Note[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  showCountWarning: boolean;
  createNote: (input?: NoteInput) => Promise<Note | null>;
  updateNote: (noteId: string, input: NoteInput) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  getNote: (noteId: string) => Promise<Note | null>;
  refreshCount: () => Promise<void>;
}

export function useNotes(): UseNotesReturn {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const unsubscribeRef = useRef<() => void>(() => {});

  const refreshCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getTotalNoteCount(user.uid);
      setTotalCount(count);
    } catch {
      console.error('Failed to get note count');
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribeNotes(
      user.uid,
      (updatedNotes) => {
        setNotes(updatedNotes);
        setTotalCount(updatedNotes.length);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    unsubscribeRef.current = unsub;

    return () => {
      unsub();
      unsubscribeRef.current = () => {};
    };
  }, [user]);

  const createNote = useCallback(async (input?: NoteInput): Promise<Note | null> => {
    if (!user) {
      setError('You must be signed in to create a note.');
      return null;
    }
    setError(null);
    try {
      const note = await createNoteService(user.uid, input);
      return note;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
      return null;
    }
  }, [user]);

  const updateNote = useCallback(async (noteId: string, input: NoteInput): Promise<void> => {
    if (!user) {
      setError('You must be signed in to update a note.');
      return;
    }
    setError(null);
    try {
      await updateNoteService(user.uid, noteId, input);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }, [user]);

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    if (!user) {
      setError('You must be signed in to delete a note.');
      return;
    }
    setError(null);
    try {
      await deleteNoteService(user.uid, noteId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }, [user]);

  const getNote = useCallback(async (noteId: string): Promise<Note | null> => {
    if (!user) return null;
    try {
      return await getNoteService(user.uid, noteId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
      return null;
    }
  }, [user]);

  const showCountWarning = totalCount > NOTE_WARN_THRESHOLD;

  return {
    notes,
    loading,
    error,
    totalCount,
    showCountWarning,
    createNote,
    updateNote,
    deleteNote,
    getNote,
    refreshCount,
  };
}
