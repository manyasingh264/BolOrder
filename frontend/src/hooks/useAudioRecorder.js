// hooks/useAudioRecorder.js
//
// Why it exists: Wraps the browser's MediaRecorder API into a clean React hook.
//               AudioRecorder component uses this — no raw Web API calls in JSX.
// Responsibility: start/stop recording, expose audioBlob + duration + errors.
// Used by: AudioRecorder component → VoiceOrderWizard → VoiceOrderPage

import { useState, useRef, useCallback } from 'react';

const useAudioRecorder = () => {
  const [isRecording, setIsRecording]   = useState(false);
  const [audioBlob,   setAudioBlob]     = useState(null);
  const [audioUrl,    setAudioUrl]      = useState(null);
  const [duration,    setDuration]      = useState(0);
  const [error,       setError]         = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);

  // ─── Start Recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url  = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Duration timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions and try again.');
    }
  }, []);

  // ─── Stop Recording ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  }, [isRecording]);

  // ─── Reset ─────────────────────────────────────────────────────────────────
  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl); // free memory
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setIsRecording(false);
  }, [audioUrl]);

  // Format seconds → "1:23"
  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return {
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    durationFormatted: formatDuration(duration),
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
};

export default useAudioRecorder;
