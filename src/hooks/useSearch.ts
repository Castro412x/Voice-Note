'use client';

import { useState, useMemo, useCallback } from 'react';
import { Note } from '@/types';

export interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  filteredNotes: Note[];
  isSearching: boolean;
  searchTags: string[];
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
}

export function useSearch(notes: Note[]): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);

  const isSearching = query.trim().length > 0 || searchTags.length > 0;

  const filteredNotes = useMemo(() => {
    let result = notes;

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerQuery) ||
          note.content.toLowerCase().includes(lowerQuery) ||
          (note.transcript && note.transcript.toLowerCase().includes(lowerQuery)),
      );
    }

    if (searchTags.length > 0) {
      result = result.filter(
        (note) => searchTags.some((tag) => note.tags.includes(tag)),
      );
    }

    return result;
  }, [notes, query, searchTags]);

  const toggleTag = useCallback((tag: string) => {
    setSearchTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setSearchTags([]);
  }, []);

  return {
    query,
    setQuery,
    filteredNotes,
    isSearching,
    searchTags,
    toggleTag,
    clearFilters,
  };
}
