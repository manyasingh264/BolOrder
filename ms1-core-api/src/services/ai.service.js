// ai.service.js — HTTP client for the FastAPI AI microservice.
//
// Responsibility: Send audio to FastAPI and return the parsed order data.
//                 NO business logic. NO database access.
//
// FastAPI Endpoint Contract:
//   POST {FASTAPI_BASE_URL}/api/process-audio
//   Body: multipart/form-data with field "audio" (audio file)
//   Response 200:
//     {
//       "shopId":        "uuid",            // matched from shop aliases
//       "shopName":      "Sharma Kirana",   // for confirmation display
//       "rawTranscript": "Sharma Ji ke...", // original speech-to-text output
//       "confidence":    0.92,              // match confidence (0-1)
//       "items": [
//         {
//           "productVariantId": "uuid",
//           "productName":      "Aloo Bhujia 500g",
//           "quantity":         10
//         }
//       ]
//     }
//
// If FastAPI is not running (development/testing), the endpoint returns a
// structured 503 error. The voice order endpoint will NOT create a partial order.

const axios    = require('axios');
const FormData = require('form-data');
const fs       = require('fs');
const config   = require('../config/env.config');
const AppError = require('../utils/AppError');

// ─── Process Audio Order ──────────────────────────────────────────────────────
// Sends the audio file to FastAPI and returns the AI-extracted order data.
//
// @param {string} filePath - absolute path to the audio file on disk
// @returns {Promise<Object>} - { shopId, shopName, rawTranscript, confidence, items }

const processAudioOrder = async (filePath) => {
  // Build multipart form — axios + form-data handles the Content-Type boundary header
  const form = new FormData();
  form.append('audio', fs.createReadStream(filePath));

  try {
    const response = await axios.post(
      `${config.fastapi.baseUrl}/api/process-audio`,
      form,
      {
        headers: {
          ...form.getHeaders(), // sets correct multipart Content-Type with boundary
        },
        timeout: 30_000, // 30 seconds — AI processing can be slow on first request
      }
    );

    const data = response.data;

    // Validate the shape of FastAPI's response before trusting it
    if (!data.shopId) {
      throw new AppError(
        'AI service could not identify the shop from the audio. Please try again or place the order manually.',
        422
      );
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new AppError(
        'AI service could not identify any products from the audio. Please try again or place the order manually.',
        422
      );
    }

    return data;

  } catch (error) {
    // Re-throw our own AppErrors (from shape validation above)
    if (error instanceof AppError) throw error;

    // FastAPI returned an error response
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.message || 'AI service returned an error.';
      throw new AppError(`AI service error: ${message}`, error.response.status || 502);
    }

    // Network error — FastAPI is not reachable (not running, wrong URL, etc.)
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      throw new AppError(
        'AI service is currently unavailable. Please check that the AI microservice is running, or place the order manually.',
        503
      );
    }

    // Request timed out
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new AppError(
        'AI service took too long to respond. Please try again with a shorter audio clip.',
        504
      );
    }

    // Unknown error
    throw new AppError('Failed to process audio order. Please try again.', 500);
  }
};

// ─── Health Check ─────────────────────────────────────────────────────────────
// Lightweight ping to verify FastAPI is reachable before a salesman starts recording.
// Frontend can call GET /api/health/ai to check this proactively.

const checkFastApiHealth = async () => {
  try {
    const response = await axios.get(`${config.fastapi.baseUrl}/health`, { timeout: 5_000 });
    return { online: true, status: response.data };
  } catch {
    return { online: false, status: null };
  }
};

module.exports = { processAudioOrder, checkFastApiHealth };
