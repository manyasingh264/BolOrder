// services/voice.api.js — Calls MS2 (Voice AI Service) directly.
//
// Why direct MS2 calls instead of going through MS1?
//   MS1 is the business microservice (orders, auth, products).
//   MS2 is the voice AI microservice (Whisper + LLM + LangGraph).
//   The frontend calls each microservice directly for its own domain.
//
// MS2 endpoints used:
//   POST /api/v1/conversation/start        → get sessionId
//   POST /api/v1/conversation/audio        → send voice audio
//   POST /api/v1/conversation/reply        → send text reply
//   GET  /api/v1/health                    → AI health check
//
// Auth: MS2 receives auth_token + salesman_id as form fields per request.

import axios from 'axios';
import store from '../redux/store';

// ─── MS2 Axios Instance ──────────────────────────────────────────────────────
const ms2 = axios.create({
  baseURL: import.meta.env.VITE_MS2_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 120000, // 120s — Whisper + LLM can take time
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getAuth = () => {
  const state = store.getState();
  return {
    token:      state.auth.token      || '',
    salesmanId: state.auth.user?.id   || '',
  };
};

// ─── startConversation ───────────────────────────────────────────────────────
// @returns {Promise<{ sessionId: string, message: string }>}
export const startConversation = async () => {
  const response = await ms2.post('/conversation/start');
  // MS2 returns { sessionId, status, message }
  return {
    sessionId: response.data.sessionId,
    message:   response.data.message,
  };
};

// ─── sendAudio ───────────────────────────────────────────────────────────────
// @param {string} sessionId
// @param {Blob}   audioBlob — from MediaRecorder (webm/mp3/wav)
// @returns {Promise<Object>} — conversation response
export const sendAudio = async (sessionId, audioBlob) => {
  const { token, salesmanId } = getAuth();

  const formData = new FormData();
  formData.append('session_id',   sessionId);
  formData.append('salesman_id',  salesmanId);
  formData.append('auth_token',   token);
  formData.append('audio',        audioBlob, 'voice-order.webm');

  const response = await ms2.post('/conversation/audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });

  return response.data;
};

// ─── sendReply ───────────────────────────────────────────────────────────────
// @param {string} sessionId
// @param {string} reply — text reply (e.g. "Haan", "Nahi", shop name)
// @returns {Promise<Object>} — conversation response
export const sendReply = async (sessionId, reply) => {
  const { token, salesmanId } = getAuth();

  const formData = new FormData();
  formData.append('session_id',   sessionId);
  formData.append('salesman_id',  salesmanId);
  formData.append('auth_token',   token);
  formData.append('reply',        reply);

  const response = await ms2.post('/conversation/reply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });

  return response.data;
};

// ─── endConversation ─────────────────────────────────────────────────────────
// Sessions expire automatically in MS2 (TTL). This is a no-op for cleanup.
export const endConversation = async (_sessionId) => {
  // MS2 sessions auto-expire. No explicit delete endpoint required.
};

// ─── checkAiServiceHealth ────────────────────────────────────────────────────
// Returns { online: boolean, message: string }
export const checkAiServiceHealth = async () => {
  try {
    const response = await ms2.get('/health', { timeout: 5000 });
    const ok = response.data?.status === 'healthy';
    return { online: ok, message: ok ? 'AI service is online.' : 'AI service unhealthy.' };
  } catch {
    return { online: false, message: 'AI service is currently offline.' };
  }
};
