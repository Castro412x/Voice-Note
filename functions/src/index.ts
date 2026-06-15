import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp } from 'firebase-admin/app';
import * as speech from '@google-cloud/speech';

initializeApp();

const db = getFirestore();
const speechClient = new speech.SpeechClient();

export const transcribeAudio = onObjectFinalized(
  {
    bucket: process.env.STORAGE_BUCKET || undefined,
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async (event) => {
    const object = event.data;
    const filePath = object.name || '';

    const match = filePath.match(/^users\/([^/]+)\/notes\/([^/]+)\/audio\.webm$/);
    if (!match) {
      console.log('File path does not match expected pattern:', filePath);
      return;
    }

    const userId = match[1];
    const noteId = match[2];

    if (!object.contentType?.startsWith('audio/')) {
      console.log('File is not audio, skipping transcription');
      return;
    }

    const bucket = getStorage().bucket(object.bucket);
    const file = bucket.file(filePath);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    });

    const audioBytesResponse = await fetch(signedUrl);
    const audioBuffer = Buffer.from(await audioBytesResponse.arrayBuffer());
    const audioBytes = audioBuffer.toString('base64');

    const audio = {
      content: audioBytes,
    };

    const config = {
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      model: 'latest_long',
      enableAutomaticPunctuation: true,
    };

    const request = {
      audio,
      config,
    };

    try {
      const [operation] = await speechClient.longRunningRecognize(request);
      const [response] = await operation.promise();

      const transcript = response.results
        ?.map((result) => result.alternatives?.[0]?.transcript || '')
        .filter(Boolean)
        .join(' ')
        .trim();

      if (transcript) {
        await db
          .collection('users')
          .doc(userId)
          .collection('notes')
          .doc(noteId)
          .update({
            transcript,
            transcriptStatus: 'completed',
            lowConfidence: false,
            updatedAt: new Date(),
          });

        console.log(`Transcription saved for note ${noteId}`);
      } else {
        await db
          .collection('users')
          .doc(userId)
          .collection('notes')
          .doc(noteId)
          .update({
            transcriptStatus: 'completed',
            updatedAt: new Date(),
          });

        console.log(`No transcript generated for note ${noteId}`);
      }
    } catch (err) {
      console.error('Transcription error:', err);

      await db
        .collection('users')
        .doc(userId)
        .collection('notes')
        .doc(noteId)
        .update({
          transcriptStatus: 'completed',
          updatedAt: new Date(),
        });
    }
  },
);
