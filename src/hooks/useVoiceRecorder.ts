'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { uploadAudio } from '@/services/storage';
import { updateNote } from '@/services/firestore';
import { triggerServerTranscription, captureLiveTranscript } from '@/services/transcription';
import { useAuth } from './useAuth';
import { AUDIO_MIME_TYPE } from '@/lib/constants';

export type RecordingState = 'idle' | 'requesting' | 'recording' | 'stopping' | 'uploading' | 'processing';

export interface UseVoiceRecorderReturn {
  state: RecordingState;
  duration: number;
  uploadProgress: number;
  liveTranscript: string;
  error: string | null;
  startRecording: (noteId: string) => Promise<void>;
  stopRecording: () => Promise<string | null>;
  clearError: () => void;
  isSupported: boolean;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const { user } = useAuth();
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentNoteIdRef = useRef<string>('');
  const liveTranscriptRef = useRef<string>('');

  const speechRef = useRef<ReturnType<typeof captureLiveTranscript> | null>(null);

  const isSupported = typeof window !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function stopMediaTracks() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  const startRecording = useCallback(async (noteId: string) => {
    if (!user) {
      setError('You must be signed in to record.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone access is not supported in this browser.');
      return;
    }

    setState('requesting');
    setError(null);
    setDuration(0);
    setUploadProgress(0);
    setLiveTranscript('');
    chunksRef.current = [];
    currentNoteIdRef.current = noteId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported(AUDIO_MIME_TYPE)
        ? AUDIO_MIME_TYPE
        : 'audio/webm;codecs=opus';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = () => {
        setError('Recording error occurred.');
        setState('idle');
        stopMediaTracks();
      };

      recorder.start(1000);
      setState('recording');

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      const speech = captureLiveTranscript();
      speechRef.current = speech;

      if (speech.isSupported) {
        speech.start(
          (text) => {
            setLiveTranscript(text);
          },
          (speechError) => {
            console.warn('Live transcript error:', speechError);
          },
        );
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access was denied. Please allow microphone permissions.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else {
        setError('Failed to start recording. Please try again.');
      }
      setState('idle');
    }
  }, [user]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (state !== 'recording' || !mediaRecorderRef.current || !user) {
      return null;
    }

    setState('stopping');

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current!;

      recorder.onstop = async () => {
        stopMediaTracks();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        let liveText = '';
        if (speechRef.current) {
          liveText = speechRef.current.stop();
          speechRef.current = null;
        }

        const transcriptText = liveText || liveTranscriptRef.current || liveTranscript;
        setLiveTranscript(transcriptText);

        const blob = new Blob(chunksRef.current, { type: AUDIO_MIME_TYPE });
        chunksRef.current = [];
        currentNoteIdRef.current = user.uid;

        if (blob.size === 0) {
          setState('idle');
          resolve(null);
          return;
        }

        setState('uploading');

        try {
          const url = await uploadAudio(
            user.uid,
            currentNoteIdRef.current,
            blob,
            (progress) => setUploadProgress(Math.round(progress)),
          );

          await updateNote(user.uid, currentNoteIdRef.current, {
            audioUrl: url,
            transcript: transcriptText || null,
            lowConfidence: true,
            transcriptStatus: transcriptText ? 'completed' : 'none',
          });

          if (transcriptText) {
            triggerServerTranscription(user.uid, currentNoteIdRef.current);
          }

          setState('idle');
          setDuration(0);
          setUploadProgress(0);
          resolve(url);
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Upload failed.');
          }
          setState('idle');
          resolve(null);
        }
      };

      recorder.stop();
    });
  }, [state, user, liveTranscript]);

  const clearError = useCallback(() => setError(null), []);

  return {
    state,
    duration,
    uploadProgress,
    liveTranscript,
    error,
    startRecording,
    stopRecording,
    clearError,
    isSupported,
  };
}
