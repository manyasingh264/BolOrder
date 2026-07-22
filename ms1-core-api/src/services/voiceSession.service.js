// voiceSession.service.js — HTTP client for MS2's conversation API.
//
// Responsibility: Proxy requests to MS2's multi-turn conversation endpoints.
//                 NO business logic. NO database access.
//
// Security: MS1 injects auth_token and salesman_id from the authenticated
//           request context, and X-Service-Key on every call so MS2 knows
//           the request truly came from MS1.

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config/env.config');
const AppError = require('../utils/AppError');

const serviceHeaders = () => ({ 'X-Service-Key': config.fastapi.serviceSecret });

// ─── Start Conversation ──────────────────────────────────────────────────────
// MS2 /start now requires salesman_id and language as Form fields.
const startConversation = async (salesmanId, language = 'hinglish') => {
  const form = new FormData();
  form.append('salesman_id', salesmanId);
  form.append('reply_language', language);

  try {
    const response = await axios.post(
      `${config.fastapi.baseUrl}/api/v1/conversation/start`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          ...serviceHeaders(),
        },
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
const sendAudio = async (sessionId, filePath, authToken, salesmanId, language = 'hinglish') => {
  const form = new FormData();
  form.append('session_id', sessionId);
  form.append('audio', fs.createReadStream(filePath));
  form.append('auth_token', authToken);
  form.append('salesman_id', salesmanId);
  form.append('reply_language', language);

  try {
    const response = await axios.post(
      `${config.fastapi.baseUrl}/api/v1/conversation/audio`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          ...serviceHeaders(),
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
const sendReply = async (sessionId, reply, authToken, salesmanId, language = 'hinglish') => {
  const form = new FormData();
  form.append('session_id', sessionId);
  form.append('reply', reply);
  form.append('auth_token', authToken);
  form.append('salesman_id', salesmanId);
  form.append('reply_language', language);

  try {
    const response = await axios.post(
      `${config.fastapi.baseUrl}/api/v1/conversation/reply`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          ...serviceHeaders(),
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
const endConversation = async (sessionId) => {
  try {
    const response = await axios.delete(
      `${config.fastapi.baseUrl}/api/v1/conversation/${sessionId}`,
      { headers: serviceHeaders(), timeout: 10_000 }
    );

    return response.data;

  } catch (error) {
    console.error('Failed to end conversation session:', error.message);
    return { message: 'Session end request failed (will expire via TTL)', sessionId };
  }
};

// ─── Health Check ─────────────────────────────────────────────────────────────
const checkFastApiHealth = async () => {
  try {
    const response = await axios.get(
      `${config.fastapi.baseUrl}/api/v1/health`,
      { headers: serviceHeaders(), timeout: 5_000 }
    );
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