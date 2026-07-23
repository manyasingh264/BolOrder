// utils/speak.js — Cross-browser TTS via Web SpeechSynthesis.
//
// Known browser quirks addressed:
//   Edge: voices load asynchronously — must wait for onvoiceschanged event
//   Edge: calling speak() immediately after cancel() causes silent failure
//   Safari: speechSynthesis.speak() must be called from a user-gesture context
//   Chrome/Firefox: generally well-behaved
//
// Two languages supported:
//   hinglish → hi-IN (Indian Hindi voices); falls back to en-IN then en-US
//   english  → en-IN (Indian English); falls back to en-US, en-GB

import { LANGUAGES } from '../redux/slices/voiceSettingSlice';

// ── Voice cache ──────────────────────────────────────────────────────────────
let _voiceCache = [];

const _loadVoices = () => {
  _voiceCache = window.speechSynthesis?.getVoices() || [];
};

// Eagerly load + listen for async update (Edge fires this later)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  _loadVoices();
  window.speechSynthesis.onvoiceschanged = _loadVoices;
}

// ── Voice picker ─────────────────────────────────────────────────────────────
// Try preferred lang → fallback chain → any available voice
const FALLBACK_CHAINS = {
  'hi-IN': ['hi-IN', 'hi', 'en-IN', 'en-US'],
  'en-IN': ['en-IN', 'en-GB', 'en-US', 'en'],
};

const _pickVoice = (langCode) => {
  const voices = _voiceCache.length ? _voiceCache : (window.speechSynthesis?.getVoices() || []);
  const chain  = FALLBACK_CHAINS[langCode] || [langCode, 'en-US'];

  for (const code of chain) {
    const exact = voices.find((v) => v.lang === code);
    if (exact) return exact;
    // Try prefix match — e.g. "hi" matches "hi-IN"
    const prefix = voices.find((v) => v.lang.startsWith(code));
    if (prefix) return prefix;
  }
  return null; // browser will use default voice
};

// ── Main export ──────────────────────────────────────────────────────────────
export const speakText = (text, languageValue) => {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

  const meta    = LANGUAGES.find((l) => l.value === languageValue) || LANGUAGES[0];
  const langCode = meta.speechLang; // 'hi-IN' or 'en-IN'

  const _speak = () => {
    const utterance  = new SpeechSynthesisUtterance(text);
    utterance.lang   = langCode;
    utterance.rate   = 0.95;
    utterance.pitch  = 1;
    utterance.volume = 1;

    const voice = _pickVoice(langCode);
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  };

  // Stop any current speech
  window.speechSynthesis.cancel();

  // Edge bug: cancel() is async — speaking immediately after cancel silently fails.
  // A 150ms delay lets Edge flush the queue before the new utterance is queued.
  setTimeout(_speak, 150);
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

// ── Utility: check if TTS is available in this browser ───────────────────────
export const isTTSSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

// ── Utility: list all voices (useful for debugging) ──────────────────────────
export const getAvailableVoices = () =>
  window.speechSynthesis?.getVoices() || [];