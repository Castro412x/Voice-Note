import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseStorage } from './firebase';
import { STORAGE_PATH, AUDIO_SIZE_LIMIT, AUDIO_MIME_TYPE } from '@/lib/constants';

export function uploadAudio(
  userId: string,
  noteId: string,
  blob: Blob,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (blob.size > AUDIO_SIZE_LIMIT) {
      reject(new Error('Audio file exceeds the 10 MB size limit.'));
      return;
    }

    if (blob.type && blob.type !== AUDIO_MIME_TYPE) {
      reject(new Error('Only audio/webm format is supported.'));
      return;
    }

    const storage = getFirebaseStorage();
    const path = STORAGE_PATH(userId, noteId);
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        const firebaseError = error as { code?: string };
        if (firebaseError.code === 'storage/unauthorized') {
          reject(new Error('You do not have permission to upload audio.'));
        } else if (firebaseError.code === 'storage/quota-exceeded') {
          reject(new Error('Storage quota exceeded. Please try again later.'));
        } else if (firebaseError.code === 'storage/canceled') {
          reject(new Error('Upload was cancelled.'));
        } else {
          reject(new Error('Failed to upload audio. Please try again.'));
        }
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch {
          reject(new Error('Failed to get audio URL.'));
        }
      },
    );
  });
}

export async function deleteAudio(userId: string, noteId: string): Promise<void> {
  const storage = getFirebaseStorage();
  const path = STORAGE_PATH(userId, noteId);
  const storageRef = ref(storage, path);

  try {
    await deleteObject(storageRef);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'storage/object-not-found') {
        return;
      }
    }
    throw new Error('Failed to delete audio file.');
  }
}

export async function getAudioUrl(userId: string, noteId: string): Promise<string | null> {
  const storage = getFirebaseStorage();
  const path = STORAGE_PATH(userId, noteId);
  const storageRef = ref(storage, path);

  try {
    return await getDownloadURL(storageRef);
  } catch {
    return null;
  }
}
