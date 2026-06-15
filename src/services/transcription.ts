import { updateNote } from './firestore';

export function triggerServerTranscription(
  userId: string,
  noteId: string,
): void {
  updateNote(userId, noteId, { transcriptStatus: 'processing' }).catch((err) => {
    console.error('Failed to set transcript status:', err);
  });
}

export function captureLiveTranscript(): {
  start: (onResult: (text: string) => void, onError: (error: string) => void) => void;
  stop: () => string;
  isSupported: boolean;
} {
  const SpeechRecognitionCtor: (new () => SpeechRecognition) | undefined =
    (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
    undefined;

  let recognition: SpeechRecognition | null = null;
  let finalTranscript = '';

  return {
    isSupported: !!SpeechRecognitionCtor,
    start(
      onResult: (text: string) => void,
      onError: (error: string) => void,
    ) {
      if (!SpeechRecognitionCtor) {
        onError('Speech recognition is not supported in this browser.');
        return;
      }

      recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        onResult((finalTranscript + interimTranscript).trim());
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed') {
          onError('Microphone access denied.');
        } else if (event.error === 'no-speech') {
          onError('No speech detected.');
        } else if (event.error === 'aborted') {
          return;
        } else {
          onError(`Speech recognition error: ${event.error}`);
        }
      };

      try {
        recognition.start();
      } catch {
        onError('Failed to start speech recognition.');
      }
    },
    stop() {
      if (recognition) {
        recognition.stop();
        recognition = null;
      }
      const transcript = finalTranscript.trim();
      finalTranscript = '';
      return transcript;
    },
  };
}
