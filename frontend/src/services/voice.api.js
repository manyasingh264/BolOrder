// services/voice.api.js — Calls MS1 only. MS1 proxies to MS2 internally.
//
// The frontend never talks to MS2 (no VITE_MS2_BASE_URL, no ms2 axios
// instance). Every voice-order call goes through ms1's /voice-sessions
// routes, which inject salesman_id from the JWT and forward to ms2 with
// the X-Service-Key.

import axiosInstance from './axios.instance';

// ─── startConversation ───────────────────────────────────────────────────────
// @param {string} language — 'hinglish' | 'english' | 'bengali' | 'marathi'
export const startConversation = async (language = 'hinglish') => {
  const response = await axiosInstance.post('/voice-sessions/start', { language });
  return response.data.data;
};

// ─── sendAudio ───────────────────────────────────────────────────────────────
export const sendAudio = async (sessionId, audioBlob, language = 'hinglish') => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice-order.webm');
  formData.append('language', language);          // ← add
  const response = await axiosInstance.post(
    `/voice-sessions/${sessionId}/audio`, formData,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
  );
  return response.data.data;
};

// ─── sendReply ───────────────────────────────────────────────────────────────
export const sendReply = async (sessionId, reply, language = 'hinglish') => {
  const response = await axiosInstance.post(
    `/voice-sessions/${sessionId}/reply`, { reply, language },   // ← add language
    { timeout: 30000 }
  );
  return response.data.data;
};

// ─── endConversation ─────────────────────────────────────────────────────────
export const endConversation = async (sessionId) => {
  const response = await axiosInstance.delete(`/voice-sessions/${sessionId}`);
  return response.data.data;
};

// ─── checkAiServiceHealth ────────────────────────────────────────────────────
export const checkAiServiceHealth = async () => {
  try {
    const response = await axiosInstance.get('/health/ai', { timeout: 5000 });
    return { online: response.data.success, message: response.data.message };
  } catch {
    return { online: false, message: 'AI service is currently offline.' };
  }
};