// redux/slices/voiceOrderSlice.js
//
// Responsibility: Manages the conversational Voice Order state.
//
// This slice handles multi-turn conversations with the AI:
//   - Start session → Record audio → Send audio → Get AI response
//   - If clarifying: Show question, allow voice or text reply → Send reply → Repeat
//   - If completed: Show final order for confirmation
//   - If cancelled/failed: Show error with retry option
//
// States:
//   IDLE           → nothing happening, show record button
//   RECORDING      → mic is active, timer running
//   RECORDED       → audio captured, show preview + send button
//   PROCESSING     → waiting for AI response
//   CONVERSATION   → AI responded, showing message + TTS, waiting for user reply
//   PREVIEW        → final order ready for confirmation
//   SUBMITTED      → order confirmed and created in backend
//   ERROR          → something went wrong, show error + retry

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  startConversation,
  sendAudio,
  sendReply,
  endConversation,
} from '../../services/voice.api';

export const VOICE_STEPS = {
  IDLE:         'IDLE',
  RECORDING:    'RECORDING',
  RECORDED:     'RECORDED',
  PROCESSING:   'PROCESSING',
  CONVERSATION: 'CONVERSATION',
  PREVIEW:      'PREVIEW',
  SUBMITTED:    'SUBMITTED',
  ERROR:        'ERROR',
};

// ─── Async Thunks ───────────────────────────────────────────────────────────────

export const startSession = createAsyncThunk(
  'voiceOrder/startSession',
  async (_, { rejectWithValue }) => {
    try {
      const result = await startConversation();
      return result; // { sessionId, message }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to start conversation. Please try again.');
    }
  }
);

export const processAudio = createAsyncThunk(
  'voiceOrder/processAudio',
  async ({ sessionId, audioBlob }, { rejectWithValue }) => {
    try {
      const result = await sendAudio(sessionId, audioBlob);
      return result; // { sessionId, status, message, audio_base64, clarification_field, draft_order, order }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to process audio. Please try again.');
    }
  }
);

export const processReply = createAsyncThunk(
  'voiceOrder/processReply',
  async ({ sessionId, reply }, { rejectWithValue }) => {
    try {
      const result = await sendReply(sessionId, reply);
      return result; // { sessionId, status, message, audio_base64, clarification_field, draft_order, order }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to send reply. Please try again.');
    }
  }
);

export const terminateSession = createAsyncThunk(
  'voiceOrder/terminateSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await endConversation(sessionId);
      return sessionId;
    } catch (err) {
      // Don't fail on session end errors
      return sessionId;
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const voiceOrderSlice = createSlice({
  name: 'voiceOrder',
  initialState: {
    step:             VOICE_STEPS.IDLE,
    sessionId:        null,   // Current conversation session ID
    audioBlob:        null,   // Blob from MediaRecorder
    audioDuration:    0,      // seconds recorded
    aiResponse:       null,   // Latest AI response { status, message, audio_base64, clarification_field, draft_order, order }
    conversationLog:  [],     // Array of { role: 'user'|'ai', message, audio_base64? }
    createdOrder:     null,   // The order returned after successful submission
    isLoading:        false,
    error:            null,
  },
  reducers: {
    setStep:          (state, action) => { state.step      = action.payload; },
    setAudioBlob:     (state, action) => { state.audioBlob = action.payload; },
    setAudioDuration: (state, action) => { state.audioDuration = action.payload; },
    setAiResponse:    (state, action) => { state.aiResponse = action.payload; },
    setCreatedOrder:  (state, action) => { state.createdOrder = action.payload; },

    // Add a message to the conversation log
    addConversationMessage: (state, action) => {
      state.conversationLog.push(action.payload);
    },

    // Reset entire wizard (e.g., "Record Another Order" button)
    resetVoiceOrder: (state) => {
      state.step             = VOICE_STEPS.IDLE;
      state.sessionId        = null;
      state.audioBlob        = null;
      state.audioDuration    = 0;
      state.aiResponse       = null;
      state.conversationLog  = [];
      state.createdOrder     = null;
      state.isLoading        = false;
      state.error            = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // startSession
      .addCase(startSession.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(startSession.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.sessionId = payload.sessionId;
      })
      .addCase(startSession.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
        state.step      = VOICE_STEPS.ERROR;
      })

      // processAudio
      .addCase(processAudio.pending, (state) => {
        state.isLoading = true;
        state.step      = VOICE_STEPS.PROCESSING;
        state.error     = null;
      })
      .addCase(processAudio.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.aiResponse = payload;

        // Add AI response to conversation log
        state.conversationLog.push({
          role: 'ai',
          message: payload.message,
          audio_base64: payload.audio_base64,
        });

        // Determine next step based on status
        if (payload.status === 'clarifying') {
          state.step = VOICE_STEPS.CONVERSATION;
        } else if (payload.status === 'confirming' || payload.status === 'completed') {
          state.step = VOICE_STEPS.PREVIEW;
        } else if (payload.status === 'cancelled' || payload.status === 'failed') {
          state.step = VOICE_STEPS.ERROR;
          state.error = payload.message || 'Conversation ended unexpectedly.';
        }
      })
      .addCase(processAudio.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
        state.step      = VOICE_STEPS.ERROR;
      })

      // processReply
      .addCase(processReply.pending, (state) => {
        state.isLoading = true;
        state.step      = VOICE_STEPS.PROCESSING;
        state.error     = null;
      })
      .addCase(processReply.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.aiResponse = payload;

        // Add AI response to conversation log
        state.conversationLog.push({
          role: 'ai',
          message: payload.message,
          audio_base64: payload.audio_base64,
        });

        // Determine next step based on status
        if (payload.status === 'clarifying') {
          state.step = VOICE_STEPS.CONVERSATION;
        } else if (payload.status === 'confirming' || payload.status === 'completed') {
          state.step = VOICE_STEPS.PREVIEW;
        } else if (payload.status === 'cancelled' || payload.status === 'failed') {
          state.step = VOICE_STEPS.ERROR;
          state.error = payload.message || 'Conversation ended unexpectedly.';
        }
      })
      .addCase(processReply.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
        state.step      = VOICE_STEPS.ERROR;
      })

      // terminateSession
      .addCase(terminateSession.fulfilled, (state) => {
        state.sessionId = null;
      });
  },
});

export const {
  setStep,
  setAudioBlob,
  setAudioDuration,
  setAiResponse,
  setCreatedOrder,
  addConversationMessage,
  resetVoiceOrder,
} = voiceOrderSlice.actions;

// Selectors
export const selectVoiceStep         = (state) => state.voiceOrder.step;
export const selectSessionId        = (state) => state.voiceOrder.sessionId;
export const selectAudioBlob        = (state) => state.voiceOrder.audioBlob;
export const selectAudioDuration    = (state) => state.voiceOrder.audioDuration;
export const selectAiResponse       = (state) => state.voiceOrder.aiResponse;
export const selectConversationLog  = (state) => state.voiceOrder.conversationLog;
export const selectCreatedOrder     = (state) => state.voiceOrder.createdOrder;
export const selectVoiceLoading     = (state) => state.voiceOrder.isLoading;
export const selectVoiceError       = (state) => state.voiceOrder.error;

export default voiceOrderSlice.reducer;
