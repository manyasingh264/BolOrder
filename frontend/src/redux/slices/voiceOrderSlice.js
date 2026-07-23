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
import { selectSelectedLanguage } from './voiceSettingSlice';

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
  async (_, { getState, rejectWithValue }) => {
    try {
      const language = selectSelectedLanguage(getState());
      const result = await startConversation(language);
      return result; // { sessionId, message }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to start conversation. Please try again.');
    }
  }
);

export const processAudio = createAsyncThunk(
  'voiceOrder/processAudio',
  async ({ sessionId, audioBlob }, { getState, rejectWithValue }) => {
    try {
      const language = selectSelectedLanguage(getState());
      const result = await sendAudio(sessionId, audioBlob, language);
      return result; // { sessionId, status, message_en, message_local, language, draft_order, order }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to process audio. Please try again.');
    }
  }
);

export const processReply = createAsyncThunk(
  'voiceOrder/processReply',
  async ({ sessionId, reply }, { getState, rejectWithValue }) => {
    try {
      const language = selectSelectedLanguage(getState());
      const result = await sendReply(sessionId, reply, language);
      return result; // { sessionId, status, message_en, message_local, language, draft_order, order }
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
    aiResponse:       null,   // Latest AI response { status, message_en, message_local, language, draft_order, order }
    conversationLog:  [],     // Array of { role: 'user'|'ai', message?, message_en?, message_local? }
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

        // Add AI response to conversation log — store both language variants,
        // the component decides which to display based on selected language.
        state.conversationLog.push({
          role: 'ai',
          message_en:    payload.message_en,
          message_local: payload.message_local,
        });

        // Determine next step based on AI response status
        if (payload.status === 'clarifying') {
          state.step = VOICE_STEPS.CONVERSATION;
        } else if (payload.status === 'confirming') {
          // Draft order preview — wait for salesman to confirm
          state.step = VOICE_STEPS.PREVIEW;
          if (payload.draft_order) {
            state.createdOrder = payload.draft_order;
          }
        } else if (payload.status === 'completed') {
          // Order created in backend
          state.step         = VOICE_STEPS.SUBMITTED;
          state.createdOrder = payload.order || payload.draft_order;
        } else if (payload.status === 'cancelled' || payload.status === 'failed') {
          state.step  = VOICE_STEPS.ERROR;
          state.error = payload.message_en || 'Conversation ended unexpectedly.';
        } else {
          // Unknown status — keep in conversation
          state.step = VOICE_STEPS.CONVERSATION;
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

        state.conversationLog.push({
          role: 'ai',
          message_en:    payload.message_en,
          message_local: payload.message_local,
        });

        if (payload.status === 'clarifying') {
          state.step = VOICE_STEPS.CONVERSATION;
        } else if (payload.status === 'confirming') {
          state.step = VOICE_STEPS.PREVIEW;
          if (payload.draft_order) {
            state.createdOrder = payload.draft_order;
          }
        } else if (payload.status === 'completed') {
          state.step         = VOICE_STEPS.SUBMITTED;
          state.createdOrder = payload.order || payload.draft_order;
        } else if (payload.status === 'cancelled' || payload.status === 'failed') {
          state.step  = VOICE_STEPS.ERROR;
          state.error = payload.message_en || 'Conversation ended unexpectedly.';
        } else {
          state.step = VOICE_STEPS.CONVERSATION;
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