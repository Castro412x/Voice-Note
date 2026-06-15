'use client';

import { Note } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { RecordButton } from './RecordButton';
import { TranscriptView } from './TranscriptView';

interface NoteEditorProps {
  note: Note;
  onSave: (noteId: string, data: { title: string; content: string; tags: string[] }) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}

export function NoteEditor({ note, onSave, onDelete }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tagsInput, setTagsInput] = useState(note.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setTagsInput(note.tags.join(', '));
    setHasChanges(false);
  }, [note.id, note.title, note.content, note.tags]);

  const save = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    await onSave(note.id, { title, content, tags });
    setSaving(false);
    setHasChanges(false);
    toast.success('Note saved');
  }, [hasChanges, title, content, tagsInput, note.id, onSave]);

  useEffect(() => {
    if (title !== note.title || content !== note.content) {
      setHasChanges(true);
    }
  }, [title, content, note.title, note.content]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save]);

  const handleDelete = async () => {
    if (!confirm('Delete this note permanently?')) return;
    setDeleting(true);
    await onDelete(note.id);
    toast.success('Note deleted');
    router.push('/');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-800 p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="flex-1 bg-transparent text-lg font-semibold text-gray-100 outline-none placeholder-gray-600"
        />
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-red-900/30 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your notes here... Markdown is supported."
          className="min-h-[200px] w-full resize-none bg-transparent text-sm text-gray-300 outline-none placeholder-gray-600"
        />

        <TranscriptView transcript={note.transcript} status={note.transcriptStatus} />

        <div className="mt-6">
          <label className="block text-xs font-medium text-gray-500">Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="meeting, project, design..."
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="border-t border-gray-800 p-4">
        <RecordButton noteId={note.id} />
      </div>
    </div>
  );
}
