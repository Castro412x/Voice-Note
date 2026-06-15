export const NOTES_PAGE_SIZE = 20;

export const NOTE_SIZE_LIMIT = 1 * 1024 * 1024;

export const AUDIO_SIZE_LIMIT = 10 * 1024 * 1024;

export const AUDIO_MIME_TYPE = 'audio/webm';

export const NOTE_WARN_THRESHOLD = 1000;

export const SHARE_EXPIRATION_HOURS = 24;

export const STORAGE_PATH = (userId: string, noteId: string) =>
  `users/${userId}/notes/${noteId}/audio.webm`;
