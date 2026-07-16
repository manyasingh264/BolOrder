// pages/VoiceOrder/VoiceOrderPage.jsx — Conversational Voice Order
// Multi-turn AI conversation with clarifications.
// Steps: IDLE → RECORDING → RECORDED → PROCESSING → CONVERSATION → PREVIEW → SUBMITTED

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mic, RefreshCw, CheckCircle2, Loader2, AlertCircle, Send, MessageSquare } from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import VoicePlayer from '../../components/VoicePlayer/VoicePlayer';
import { StatusBadge } from '../../components/Badge/Badge';

import {
  startSession,
  processAudio,
  processReply,
  terminateSession,
  resetVoiceOrder,
  setStep,
  setAudioBlob,
  addConversationMessage,
  selectVoiceStep,
  selectSessionId,
  selectAiResponse,
  selectConversationLog,
  selectVoiceLoading,
  selectVoiceError,
  VOICE_STEPS,
} from '../../redux/slices/voiceOrderSlice';
import { createOrder } from '../../redux/slices/ordersSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { formatCurrency } from '../../utils';
import useAudioRecorder from '../../hooks/useAudioRecorder';

const VoiceOrderPage = () => {
  const dispatch   = useDispatch();
  const step       = useSelector(selectVoiceStep);
  const sessionId  = useSelector(selectSessionId);
  const aiResponse = useSelector(selectAiResponse);
  const conversationLog = useSelector(selectConversationLog);
  const isLoading  = useSelector(selectVoiceLoading);
  const error      = useSelector(selectVoiceError);

  const recorder = useAudioRecorder();
  const [textReply, setTextReply] = useState('');

  // Start session when entering IDLE state
  useEffect(() => {
    if (step === VOICE_STEPS.IDLE && !sessionId) {
      dispatch(startSession());
    }
  }, [step, sessionId, dispatch]);

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        dispatch(terminateSession(sessionId));
      }
    };
  }, [sessionId, dispatch]);

  const handleStopAndProcess = async () => {
    recorder.stopRecording();
    await new Promise(r => setTimeout(r, 200));
    dispatch(setStep(VOICE_STEPS.RECORDED));
  };

  const handleSendAudio = async () => {
    if (!sessionId || !recorder.audioBlob) return;

    // Add user audio to conversation log
    dispatch(addConversationMessage({
      role: 'user',
      message: '[Audio recording]',
    }));

    await dispatch(processAudio({ sessionId, audioBlob: recorder.audioBlob }));
  };

  const handleSendTextReply = async () => {
    if (!sessionId || !textReply.trim()) return;

    const reply = textReply.trim();
    setTextReply('');

    // Add user text to conversation log
    dispatch(addConversationMessage({
      role: 'user',
      message: reply,
    }));

    await dispatch(processReply({ sessionId, reply }));
  };

  const handleConfirmOrder = async () => {
    if (!aiResponse?.draft_order) return;

    // Send confirmation reply to MS2 conversation
    const result = await dispatch(processReply({ sessionId, reply: 'yes' }));
    
    if (processReply.fulfilled.match(result)) {
      // Check if the response contains a completed order
      if (result.payload?.status === 'completed' && result.payload?.order) {
        dispatch(setStep(VOICE_STEPS.SUBMITTED));
        dispatch(addToast({ message: 'Order created successfully!', type: 'success' }));
        // Clean up session after successful order
        if (sessionId) {
          dispatch(terminateSession(sessionId));
        }
      } else {
        // Handle case where confirmation didn't complete the order
        dispatch(addToast({ message: 'Confirmation failed. Please try again.', type: 'error' }));
      }
    } else {
      dispatch(addToast({ message: 'Failed to send confirmation', type: 'error' }));
    }
  };

  const handleReset = () => {
    if (sessionId) {
      dispatch(terminateSession(sessionId));
    }
    recorder.resetRecording();
    setTextReply('');
    dispatch(resetVoiceOrder());
  };

  return (
    <DashboardLayout title="Voice Order">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Mic size={20} className="text-primary-500" />
            <h1 className="page-title">Voice Order</h1>
          </div>
          <p className="page-subtitle">Record your order in Hindi or Hinglish — AI will extract the details and ask clarifying questions if needed.</p>
        </div>

        {/* ── IDLE / RECORDING / RECORDED ─────────────────────────────── */}
        {[VOICE_STEPS.IDLE, VOICE_STEPS.RECORDING, VOICE_STEPS.RECORDED].includes(step) && (
          <Card>
            <Card.Header>
              <h2 className="text-base font-semibold">
                {step === VOICE_STEPS.IDLE     ? 'Ready to Record' :
                 step === VOICE_STEPS.RECORDING ? 'Recording…' : 'Recording Complete'}
              </h2>
            </Card.Header>
            <Card.Body className="flex flex-col items-center">
              {step !== VOICE_STEPS.RECORDED && (
                <div className="w-full">
                  <div className="flex flex-col items-center gap-6 py-4">
                    <div className="relative">
                      {recorder.isRecording && (
                        <div className="absolute inset-0 rounded-full bg-red-400 recording-pulse scale-125 opacity-30" />
                      )}
                      <button
                        onClick={recorder.isRecording ? handleStopAndProcess : recorder.startRecording}
                        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-card-md transition-all ${
                          recorder.isRecording
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-primary-500 hover:bg-primary-600 text-white'
                        }`}
                        disabled={isLoading}
                      >
                        {recorder.isRecording
                          ? <span className="w-7 h-7 bg-white rounded-sm" />
                          : <Mic size={30} />
                        }
                      </button>
                    </div>
                    {recorder.isRecording ? (
                      <div className="text-center">
                        <div className="flex items-center gap-2 justify-center mb-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm font-semibold text-red-600">Recording…</span>
                        </div>
                        <span className="text-3xl font-mono font-bold text-surface-800">{recorder.durationFormatted}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-surface-500 text-center">
                        Tap the mic to start · Speak in Hindi or Hinglish
                      </p>
                    )}
                    {recorder.error && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg w-full">
                        <AlertCircle size={16} className="text-red-500" />
                        <p className="text-xs text-red-700">{recorder.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === VOICE_STEPS.RECORDED && recorder.audioUrl && (
                <div className="w-full space-y-6">
                  <VoicePlayer audioUrl={recorder.audioUrl} duration={recorder.durationFormatted} />
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleReset} className="flex-1 justify-center">
                      Record Again
                    </Button>
                    <Button variant="primary" onClick={handleSendAudio} isLoading={isLoading} className="flex-1 justify-center">
                      Send to AI
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* ── PROCESSING ───────────────────────────────────────────────── */}
        {step === VOICE_STEPS.PROCESSING && (
          <Card>
            <Card.Body className="flex flex-col items-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
                <Loader2 size={32} className="text-primary-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-surface-800">AI is processing…</p>
                <p className="text-sm text-surface-400 mt-1">Extracting shop name, products, and quantities</p>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* ── CONVERSATION (AI asking clarification) ───────────────────── */}
        {step === VOICE_STEPS.CONVERSATION && aiResponse && (
          <div className="space-y-4">
            {/* AI Message Card */}
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary-500" />
                  <h2 className="text-base font-semibold">AI Assistant</h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-4">
                {/* AI Text Message */}
                <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                  <p className="text-sm text-surface-800">{aiResponse.message}</p>
                </div>

                {/* TTS Audio Playback */}
                {aiResponse.audio_base64 && (
                  <div className="flex items-center gap-3">
                    <VoicePlayer
                      audioUrl={`data:audio/mp3;base64,${aiResponse.audio_base64}`}
                      duration="AI Response"
                    />
                  </div>
                )}

                {/* Clarification Field Indicator */}
                {aiResponse.clarification_field && (
                  <div className="flex items-center gap-2 text-xs text-surface-400">
                    <span className="px-2 py-1 bg-surface-100 rounded-full">
                      Clarifying: {aiResponse.clarification_field}
                    </span>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* User Reply Options */}
            <Card>
              <Card.Header>
                <h2 className="text-base font-semibold">Your Reply</h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                {/* Text Reply Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textReply}
                    onChange={(e) => setTextReply(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendTextReply()}
                    placeholder="Type your answer here..."
                    className="flex-1 px-4 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendTextReply}
                    isLoading={isLoading}
                    disabled={!textReply.trim()}
                    className="px-4"
                  >
                    <Send size={18} />
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-surface-400">or</span>
                  </div>
                </div>

                {/* Voice Reply */}
                <div className="flex flex-col items-center gap-4 py-2">
                  <button
                    onClick={recorder.isRecording ? handleStopAndProcess : recorder.startRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-card-md transition-all ${
                      recorder.isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-primary-500 hover:bg-primary-600 text-white'
                    }`}
                    disabled={isLoading}
                  >
                    {recorder.isRecording
                      ? <span className="w-5 h-5 bg-white rounded-sm" />
                      : <Mic size={24} />
                    }
                  </button>
                  {recorder.isRecording ? (
                    <div className="text-center">
                      <span className="text-2xl font-mono font-bold text-surface-800">{recorder.durationFormatted}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-surface-500">Record your answer</p>
                  )}
                </div>

                {step === VOICE_STEPS.RECORDED && recorder.audioUrl && (
                  <div className="flex gap-2">
                    <VoicePlayer audioUrl={recorder.audioUrl} duration={recorder.durationFormatted} />
                    <Button
                      variant="primary"
                      onClick={handleSendAudio}
                      isLoading={isLoading}
                      className="flex-1"
                    >
                      Send Voice Reply
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Cancel Button */}
            <Button variant="secondary" onClick={handleReset} className="w-full">
              Cancel & Start Over
            </Button>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────────────────── */}
        {step === VOICE_STEPS.ERROR && (
          <Card>
            <Card.Body className="flex flex-col items-center py-10 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle size={30} className="text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-surface-800">Processing Failed</p>
                <p className="text-sm text-surface-400 mt-1">{error}</p>
              </div>
              <Button onClick={handleReset} variant="secondary">Try Again</Button>
            </Card.Body>
          </Card>
        )}

        {/* ── PREVIEW (Final Order) ──────────────────────────────────────── */}
        {step === VOICE_STEPS.PREVIEW && aiResponse?.draft_order && (
          <div className="space-y-4">
            <Card>
              <Card.Header>
                <h2 className="text-base font-semibold">Order Summary</h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-surface-500">Shop:</span>
                  <span className="font-semibold text-surface-800">{aiResponse.draft_order.shopName || 'Unknown'}</span>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h2 className="text-base font-semibold">Order Items</h2>
                <span className="text-sm text-surface-400">{aiResponse.draft_order.items?.length || 0} items</span>
              </Card.Header>
              <div className="divide-y divide-surface-100">
                {aiResponse.draft_order.items?.map((item, i) => (
                  <div key={i} className="px-6 py-3.5 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{item.productName}</p>
                      <p className="text-xs text-surface-400">{formatCurrency(item.unitPrice)} each</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-surface-400">×{item.quantity}</p>
                      <p className="text-sm font-semibold">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-surface-200 flex justify-between">
                <span className="font-semibold text-surface-700">Estimated Total</span>
                <span className="font-bold text-lg text-surface-900">
                  {formatCurrency(aiResponse.draft_order.items?.reduce((sum, i) => sum + parseFloat(i.subtotal || 0), 0) || 0)}
                </span>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleReset} className="flex-1 justify-center">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmOrder} isLoading={isLoading} className="flex-1 justify-center">
                Confirm & Create Order
              </Button>
            </div>
          </div>
        )}

        {/* ── SUBMITTED ────────────────────────────────────────────────── */}
        {step === VOICE_STEPS.SUBMITTED && (
          <Card>
            <Card.Body className="flex flex-col items-center py-12 gap-5 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-surface-900">Order Created!</h2>
                <p className="text-surface-500 mt-1 text-sm">The order has been successfully submitted.</p>
              </div>
              <div className="flex gap-3 w-full justify-center">
                <Button variant="secondary" onClick={handleReset} leftIcon={<RefreshCw size={15} />}>
                  Record Another Order
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VoiceOrderPage;
