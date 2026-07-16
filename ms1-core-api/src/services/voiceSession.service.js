// voiceSession.service.js — HTTP client for MS2's conversation API.
//
// Responsibility: Proxy requests to MS2's multi-turn conversation endpoints.
//                 NO business logic. NO database access.
//
// MS2 Endpoint Contract (all under /api/v1/conversation):
//   POST /start          — Create a new session, returns { sessionId, message }
//   POST /audio          — Send audio file, get AI response with TTS audio
//   POST /reply          — Send text reply, get AI response with TTS audio
//   DELETE /{session_id} — End session early
//
// Response shape (from all endpoints except /start):
//   {
//     sessionId: str,
//     status: "clarifying" | "completed" | "cancelled" | "failed",
//     message: str,              // AI's text response
//     audio_base64: str,         // TTS audio of the message
//     clarification_field: str,  // e.g. "shop", "product" (if status === "clarifying")
//     draft_order: object,       // Parsed order before confirmation (if available)
//     order: object              // Final order after confirmation (if status === "completed")
//   }
//
// Security: MS1 injects auth_token and salesman_id from the authenticated request context.
//           Never trust these from client input.

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config/env.config');
const AppError = require('../utils/AppError');

// ─── Start Conversation ──────────────────────────────────────────────────────
// Creates a new session in MS2.
//
// @returns {Promise<Object>} - { sessionId, message }
const startConversation = async () => {
  try {
    const response = await axios.post(
      `${config.fastapi.baseUrl}/api/v1/conversation/start`,
      {},
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10_000,
      }
    );

    const data = response.data;

    if (!data.sessionId) {
      throw new AppError('AI service failed to create a session. Please try again.', 502);
    }

    return data;

  } catch (error) {
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.message || 'AI service returned an error.';
      throw new AppError(`AI service error: ${message}`, error.response.status || 502);
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      throw new AppError(
        'AI service is currently unavailable. Please check that the AI microservice is running.',
        503
      );
    }

    throw new AppError('Failed to start conversation. Please try again.', 500);
  }
};

// ─── Send Audio ───────────────────────────────────────────────────────────────
// Sends audio file to MS2 for transcription and AI processing.
//
// @param {string} sessionId - Session ID from /start
// @param {string} filePath - Absolute path to the audio file on disk
// @param {string} authToken - Salesman's JWT token forwarded to MS2
// @param {string} salesmanId - Salesman's UUID from req.user
// @returns {Promise<Object>} - Conversation response with TTS audio
const sendAudio = async (sessionId, filePath, authToken, salesmanId) => {
  const form = new FormData();
  form.append('session_id', sessionId);
  form.append('audio', fs.createReadStream(filePath));
  form.append('auth_token', authToken);
  form.append('salesman_id', salesmanId);

  try {
    const response = await axios.post(
      `${config.fastapi.baseUrl}/api/v1/conversation/audio`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 60_000, // 60 seconds — AI processing can be slow
      }
    );

    return response.data;

  } catch (error) {
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.message || 'AI service returned an error.';
      throw new AppError(`AI service error: ${message}`, error.response.status || 502);
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      throw new AppError(
        'AI service is currently unavailable. Please check that the AI microservice is running.',
        503
      );
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new AppError(
        'AI service took too long to respond. Please try again with a shorter audio clip.',
        504
      );
    }

    throw new AppError('Failed to process audio. Please try again.', 500);
  }
};

// ─── Send Text Reply ───────────────────────────────────────────────────────────
// Sends a text reply to MS2 (for clarification or confirmation).
//
// @param {string} sessionId - Session ID
// @param {string} reply - The salesman's text reply
// @param {string} authToken - Salesman's JWT token
// @returns {Promise<Object>} - Conversation response with TTS audio
const sendReply = async (sessionId, reply, authToken) => {
  const form = new FormData();
  form.append('session_id', sessionId);
  form.append('reply', reply);
  form.append('auth_token', authToken);

  try {
    const response = await axios.post(
      `${config.fastapi.baseUrl}/api/v1/conversation/reply`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 30_000,
      }
    );

    return response.data;

  } catch (error) {
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.message || 'AI service returned an error.';
      throw new AppError(`AI service error: ${message}`, error.response.status || 502);
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      throw new AppError(
        'AI service is currently unavailable. Please check that the AI microservice is running.',
        503
      );
    }

    throw new AppError('Failed to send reply. Please try again.', 500);
  }
};

// ─── End Conversation ─────────────────────────────────────────────────────────
// Explicitly ends a session in MS2.
//
// @param {string} sessionId - Session ID to end
// @returns {Promise<Object>} - { message, sessionId }
const endConversation = async (sessionId) => {
  try {
    const response = await axios.delete(
      `${config.fastapi.baseUrl}/api/v1/conversation/${sessionId}`,
      { timeout: 10_000 }
    );

    return response.data;

  } catch (error) {
    // Don't throw on session end errors — log and continue
    // The session will expire naturally via TTL anyway
    console.error('Failed to end conversation session:', error.message);
    return { message: 'Session end request failed (will expire via TTL)', sessionId };
  }
};

// ─── Health Check ─────────────────────────────────────────────────────────────
// Lightweight ping to verify MS2 is reachable.
const checkFastApiHealth = async () => {
  try {
    const response = await axios.get(`${config.fastapi.baseUrl}/api/v1/health`, { timeout: 5_000 });
    return { online: true, status: response.data };
  } catch {
    return { online: false, status: null };
  }
};

module.exports = {
  startConversation,
  sendAudio,
  sendReply,
  endConversation,
  checkFastApiHealth,
};
