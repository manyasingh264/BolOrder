// utils/speak.js — browser-native TTS via SpeechSynthesis.
// Replaces the old server-side gTTS audio_base64 playback.

import { LANGUAGES } from '../redux/slices/voiceSettingSlice';

export const speakText = (text, languageValue) => {
  if (!text || !window.speechSynthesis) return;

  window.speechSynthesis.cancel(); // stop any previous utterance

  const meta = LANGUAGES.find((l) => l.value === languageValue) || LANGUAGES[0];
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = meta.speechLang;
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
};