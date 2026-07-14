// redux/slices/voiceOrderSlice.js
//
// Responsibility: Manages the multi-step Voice Order wizard state.
//
// Steps:
//   IDLE        → nothing happening, show record button
//   RECORDING   → mic is active, timer running
//   RECORDED    → audio captured, show preview + upload button
//   PROCESSING  → waiting for AI (mocked or real FastAPI)
//   PREVIEW     → AI returned result, show extracted order for review
//   SUBMITTED   → order confirmed and created in backend
//   ERROR       → something went wrong, show error + retry
//
// API Layer (voice.api.js) is the ONLY thing that changes when FastAPI is ready.
// This slice and all wizard components remain unchanged.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { submitVoiceOrder } from '../../services/voice.api';

export const VOICE_STEPS = {
  IDLE:       'IDLE',
  RECORDING:  'RECORDING',
  RECORDED:   'RECORDED',
  PROCESSING: 'PROCESSING',
  PREVIEW:    'PREVIEW',
  SUBMITTED:  'SUBMITTED',
  ERROR:      'ERROR',
};

// ─── Async Thunk — Process Voice Order ────────────────────────────────────────
// Sends audio to voice.api.js (currently mocked, later real FastAPI).
// Returns: { shopId, shopName, rawTranscript, confidence, items[] }
export const processVoiceOrder = createAsyncThunk(
  'voiceOrder/process',
  async (audioBlob, { rejectWithValue }) => {
    try {
      const result = await submitVoiceOrder(audioBlob);
      return result; // { shopId, shopName, rawTranscript, confidence, items[] }
    } catch (err) {
      return rejectWithValue(err.message || 'AI processing failed. Please try again.');
    }
  }
);

const voiceOrderSlice = createSlice({
  name: 'voiceOrder',
  initialState: {
    step:          VOICE_STEPS.IDLE,
    audioBlob:     null,   // Blob from MediaRecorder
    audioDuration: 0,      // seconds recorded
    aiResult:      null,   // { shopId, shopName, rawTranscript, confidence, items[] }
    createdOrder:  null,   // the order returned after successful submission
    isLoading:     false,
    error:         null,
  },
  reducers: {
    setStep:          (state, action) => { state.step      = action.payload; },
    setAudioBlob:     (state, action) => { state.audioBlob = action.payload; },
    setAudioDuration: (state, action) => { state.audioDuration = action.payload; },
    setAiResult:      (state, action) => { state.aiResult  = action.payload; },
    setCreatedOrder:  (state, action) => { state.createdOrder = action.payload; },

    // Reset entire wizard (e.g., "Record Another Order" button)
    resetVoiceOrder: (state) => {
      state.step          = VOICE_STEPS.IDLE;
      state.audioBlob     = null;
      state.audioDuration = 0;
      state.aiResult      = null;
      state.createdOrder  = null;
      state.isLoading     = false;
      state.error         = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(processVoiceOrder.pending, (state) => {
        state.isLoading = true;
        state.step      = VOICE_STEPS.PROCESSING;
        state.error     = null;
      })
      .addCase(processVoiceOrder.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.aiResult  = payload;
        state.step      = VOICE_STEPS.PREVIEW;
      })
      .addCase(processVoiceOrder.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
        state.step      = VOICE_STEPS.ERROR;
      });
  },
});

export const {
  setStep,
  setAudioBlob,
  setAudioDuration,
  setAiResult,
  setCreatedOrder,
  resetVoiceOrder,
} = voiceOrderSlice.actions;

// Selectors
export const selectVoiceStep      = (state) => state.voiceOrder.step;
export const selectAudioBlob      = (state) => state.voiceOrder.audioBlob;
export const selectAudioDuration  = (state) => state.voiceOrder.audioDuration;
export const selectAiResult       = (state) => state.voiceOrder.aiResult;
export const selectCreatedOrder   = (state) => state.voiceOrder.createdOrder;
export const selectVoiceLoading   = (state) => state.voiceOrder.isLoading;
export const selectVoiceError     = (state) => state.voiceOrder.error;

export default voiceOrderSlice.reducer;
