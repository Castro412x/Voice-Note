export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  transcript: string | null;
  audioUrl: string | null;
  tags: string[];
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
  transcriptStatus: 'none' | 'processing' | 'completed';
  lowConfidence: boolean;
}

export interface NoteInput {
  title?: string;
  content?: string;
  transcript?: string | null;
  audioUrl?: string | null;
  tags?: string[];
  transcriptStatus?: 'none' | 'processing' | 'completed';
  lowConfidence?: boolean;
}

export interface AudioUpload {
  noteId: string;
  userId: string;
  file: Blob;
  url: string;
}

export interface SearchResult {
  notes: Note[];
  query: string;
}

export type SortOrder = 'desc' | 'asc';
