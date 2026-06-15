import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { Note, NoteInput } from '@/types';
import { NOTES_PAGE_SIZE } from '@/lib/constants';
import { generateDefaultTitle } from '@/lib/utils';

const NOTES_COLLECTION = 'notes';

function notesRef(db: Firestore, userId: string) {
  return collection(db, 'users', userId, NOTES_COLLECTION);
}

function mapNote(id: string, data: DocumentData): Note {
  const createdAt = data.createdAt instanceof Timestamp
    ? { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds }
    : { seconds: 0, nanoseconds: 0 };
  const updatedAt = data.updatedAt instanceof Timestamp
    ? { seconds: data.updatedAt.seconds, nanoseconds: data.updatedAt.nanoseconds }
    : { seconds: 0, nanoseconds: 0 };

  return {
    id,
    title: data.title || '',
    content: data.content || '',
    transcript: data.transcript || null,
    audioUrl: data.audioUrl || null,
    tags: data.tags || [],
    createdAt,
    updatedAt,
    transcriptStatus: data.transcriptStatus || 'none',
    lowConfidence: data.lowConfidence || false,
  };
}

export async function createNote(
  userId: string,
  input?: NoteInput,
): Promise<Note> {
  const db = await getFirebaseDb();
  const ref = notesRef(db, userId);
  const now = serverTimestamp();

  const data: Record<string, unknown> = {
    title: input?.title || generateDefaultTitle(),
    content: input?.content || '',
    transcript: input?.transcript || null,
    audioUrl: input?.audioUrl || null,
    tags: input?.tags || [],
    createdAt: now,
    updatedAt: now,
    transcriptStatus: input?.transcriptStatus || 'none',
    lowConfidence: input?.lowConfidence || false,
  };

  try {
    const docRef = await addDoc(ref, data);
    const docSnap = await getDoc(docRef);
    return mapNote(docRef.id, docSnap.data()!);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'permission-denied') {
        throw new Error('You do not have permission to create notes.');
      }
      if (firebaseError.code === 'resource-exhausted') {
        throw new Error('Quota exceeded. Please try again later.');
      }
    }
    throw new Error('Failed to create note. Please try again.');
  }
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: NoteInput,
): Promise<void> {
  const db = await getFirebaseDb();
  const noteRef = doc(notesRef(db, userId), noteId);

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.content !== undefined) data.content = input.content;
  if (input.transcript !== undefined) data.transcript = input.transcript;
  if (input.audioUrl !== undefined) data.audioUrl = input.audioUrl;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.transcriptStatus !== undefined) data.transcriptStatus = input.transcriptStatus;
  if (input.lowConfidence !== undefined) data.lowConfidence = input.lowConfidence;
  data.updatedAt = serverTimestamp();

  if (Object.keys(data).length === 1) return;

  try {
    await updateDoc(noteRef, data);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'permission-denied') {
        throw new Error('You do not have permission to edit this note.');
      }
      if (firebaseError.code === 'not-found') {
        throw new Error('Note not found.');
      }
    }
    throw new Error('Failed to update note. Please try again.');
  }
}

export async function deleteNote(
  userId: string,
  noteId: string,
): Promise<void> {
  const db = await getFirebaseDb();
  const noteRef = doc(notesRef(db, userId), noteId);

  try {
    await deleteDoc(noteRef);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'permission-denied') {
        throw new Error('You do not have permission to delete this note.');
      }
      if (firebaseError.code === 'not-found') {
        throw new Error('Note not found.');
      }
    }
    throw new Error('Failed to delete note. Please try again.');
  }
}

export async function getNote(
  userId: string,
  noteId: string,
): Promise<Note | null> {
  const db = await getFirebaseDb();
  const noteRef = doc(notesRef(db, userId), noteId);

  try {
    const docSnap = await getDoc(noteRef);
    if (!docSnap.exists()) return null;
    return mapNote(docSnap.id, docSnap.data());
  } catch (err: unknown) {
    if (err instanceof Error) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'permission-denied') {
        throw new Error('You do not have permission to view this note.');
      }
    }
    throw new Error('Failed to load note. Please try again.');
  }
}

export async function getNotesBatch(
  userId: string,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null,
  pageSize: number = NOTES_PAGE_SIZE,
): Promise<{ notes: Note[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> {
  const db = await getFirebaseDb();
  const ref = notesRef(db, userId);

  let q;
  if (lastDoc) {
    q = query(
      ref,
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize + 1),
    );
  } else {
    q = query(
      ref,
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1),
    );
  }

  try {
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const notes = docs.slice(0, pageSize).map((d) => mapNote(d.id, d.data()));
    const newLastDoc = notes.length > 0 ? docs[Math.min(docs.length, pageSize) - 1] : null;
    return { notes, lastDoc: newLastDoc, hasMore };
  } catch (err: unknown) {
    if (err instanceof Error) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'permission-denied') {
        throw new Error('You do not have permission to view notes.');
      }
    }
    throw new Error('Failed to load notes. Please try again.');
  }
}

export function subscribeNotes(
  userId: string,
  onNotes: (notes: Note[]) => void,
  onError: (error: Error) => void,
): () => void {
  let unsub: (() => void) | null = null;

  getFirebaseDb().then((db) => {
    const ref = notesRef(db, userId);
    const q = query(ref, orderBy('createdAt', 'desc'));

    unsub = onSnapshot(
      q,
      (snapshot) => {
        const notes = snapshot.docs.map((d) => mapNote(d.id, d.data()));
        onNotes(notes);
      },
      (err) => {
        const firebaseError = err as { code?: string };
        if (firebaseError.code === 'permission-denied') {
          onError(new Error('You do not have permission to view notes.'));
        } else if (firebaseError.code === 'unavailable') {
          onError(new Error('Network error. Changes will sync when you are back online.'));
        } else {
          onError(new Error('Failed to sync notes.'));
        }
      },
    );
  });

  return () => {
    if (unsub) unsub();
  };
}

export async function getTotalNoteCount(userId: string): Promise<number> {
  const db = await getFirebaseDb();
  const ref = notesRef(db, userId);
  const q = query(ref, orderBy('createdAt', 'desc'));

  try {
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch {
    return 0;
  }
}
