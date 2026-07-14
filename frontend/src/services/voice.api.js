// services/voice.api.js — API layer for the Voice Order AI feature.
//
// ══════════════════════════════════════════════════════════════
// THIS IS THE ONLY FILE THAT CHANGES WHEN FASTAPI IS READY.
// ══════════════════════════════════════════════════════════════
//
// Current state: MOCKED
//   - Simulates 2.5 second AI processing delay
//   - Returns a realistic fake response
//   - No backend call is made
//
// Future state: REAL (FastAPI via Express bridge)
//   - Comment out the mock section
//   - Uncomment the real implementation
//   - POST /api/orders/voice with multipart/form-data (field: "audio")
//   - Express (MS1) forwards to FastAPI, creates order, returns result
//
// Zero React component changes required — this is the seam.

import api from './axios.instance';

// ─── MOCK RESPONSE ────────────────────────────────────────────────────────────
// Realistic fake data that matches exactly what FastAPI will return.
// Replace with actual UUIDs from your seeded database for realistic testing.
const MOCK_AI_RESPONSE = {
  shopId:        'mock-shop-id-001',
  shopName:      'Sharma Kirana Store',
  rawTranscript: 'Sharma ji ke liye, das packet aloo bhujia 200 gram aur paanch packet mixture 500 gram chahiye.',
  confidence:    0.94,
  items: [
    {
      productVariantId: 'mock-variant-id-001',
      productName:      'Aloo Bhujia 200g',
      quantity:         10,
      unitPrice:        '30.00',
      subtotal:         '300.00',
    },
    {
      productVariantId: 'mock-variant-id-002',
      productName:      'Mixture 500g',
      quantity:         5,
      unitPrice:        '65.00',
      subtotal:         '325.00',
    },
  ],
};

// ─── submitVoiceOrder ─────────────────────────────────────────────────────────
// @param {Blob} audioBlob — the recorded audio from the browser MediaRecorder
// @returns {Promise<Object>} — { shopId, shopName, rawTranscript, confidence, items[] }
//
export const submitVoiceOrder = async (audioBlob) => {
  // ══ MOCK IMPLEMENTATION (active now) ══════════════════════════════════════
  // Simulates AI processing time so the UI transition feels real.
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Simulate occasional AI failure (uncomment to test error handling):
  // if (Math.random() < 0.2) throw new Error('AI service unavailable. Please try again.');

  return MOCK_AI_RESPONSE;
  // ══ END MOCK ══════════════════════════════════════════════════════════════

  // ══ REAL IMPLEMENTATION (uncomment when FastAPI + MS1 bridge is ready) ══
  // const formData = new FormData();
  // formData.append('audio', audioBlob, 'voice-order.webm');
  //
  // const response = await api.post('/orders/voice', formData, {
  //   headers: { 'Content-Type': 'multipart/form-data' },
  //   timeout: 60000, // 60 seconds for AI processing
  // });
  //
  // return response.data.data;
  // ══ END REAL ══════════════════════════════════════════════════════════════
};

// ─── checkAiServiceHealth ─────────────────────────────────────────────────────
// Called before showing the record button.
// If AI is offline, frontend disables recording and shows a warning.
export const checkAiServiceHealth = async () => {
  try {
    const response = await api.get('/health/ai');
    return { online: response.data.success, message: response.data.message };
  } catch {
    return { online: false, message: 'AI service is currently offline.' };
  }
};
