// pages/VoiceOrder/VoiceOrderPage.jsx — Bilingual Voice Order (Hinglish / English)
//
// Language-aware:
//   - UI labels shown in both Hinglish and English based on selected language
//   - AI responses use message_local (Hinglish) or message_en (English)
//   - STT uses hi-IN for Hinglish, en-IN for English
//   - TTS speaks in the right language
//
// Steps: IDLE → RECORDING → RECORDED → PROCESSING → CONVERSATION → PREVIEW → SUBMITTED

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Mic, MicOff, RefreshCw, CheckCircle2, Loader2,
  AlertCircle, Send, ShoppingBag, Store, Sparkles,
  Volume2, ChevronRight,
} from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Button from '../../components/Button/Button';
import LanguageSelect from '../../components/LanguageSelect/LanguageSelect';

import {
  startSession, processAudio, processReply, terminateSession,
  resetVoiceOrder, setStep, addConversationMessage,
  selectVoiceStep, selectSessionId, selectAiResponse,
  selectConversationLog, selectCreatedOrder, selectVoiceLoading,
  selectVoiceError, VOICE_STEPS,
} from '../../redux/slices/voiceOrderSlice';
import { selectSelectedLanguage, selectSelectedLanguageMeta } from '../../redux/slices/voiceSettingSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { speakText, isTTSSupported } from '../../utils/speak';
import useAudioRecorder from '../../hooks/useAudioRecorder';

// ── Bilingual string map ──────────────────────────────────────────────────────
const T = {
  hinglish: {
    title:           'Voice Order',
    subtitle:        'Boliye apna order — AI samjhega aur confirm karega',
    readyTitle:      'Bolne ke liye tayyar',
    readyHint:       'Mic dabao aur order bolo',
    recordingLabel:  'Recording…',
    stopLabel:       'Rokne ke liye dabao',
    retake:          'Dobara record karo',
    sendAudio:       'AI ko bhejo',
    processingTitle: 'AI process kar raha hai…',
    processingHint:  'Dukaan, product aur matra nikal raha hai',
    aiLabel:         'BolOrder AI',
    yourReply:       'Aapka jawab',
    typeReply:       'Yahan likhiye…',
    orLabel:         'ya',
    voiceReply:      'Voice mein jawab do',
    cancelOrder:     'Roko aur naye se shuru karo',
    orderSummary:    'Order Summary',
    shop:            'Dukaan',
    orderItems:      'Order Items',
    confirmOrder:    'Order Confirm Karo',
    cancel:          'Roko',
    orderCreated:    'Order Ban Gaya! 🎉',
    orderSuccess:    'Order safaltapurvak submit ho gaya',
    newOrder:        'Naya Order Record Karo',
    errorTitle:      'Kuch gadbad hui',
    tryAgain:        'Dobara try karo',
    items:           'items',
    qty:             'matra',
  },
  english: {
    title:           'Voice Order',
    subtitle:        'Speak your order — AI will extract details and confirm',
    readyTitle:      'Ready to Record',
    readyHint:       'Tap the mic and speak your order',
    recordingLabel:  'Recording…',
    stopLabel:       'Tap to stop',
    retake:          'Record Again',
    sendAudio:       'Send to AI',
    processingTitle: 'AI is processing…',
    processingHint:  'Extracting shop, products and quantities',
    aiLabel:         'BolOrder AI',
    yourReply:       'Your Reply',
    typeReply:       'Type your answer here…',
    orLabel:         'or',
    voiceReply:      'Voice reply',
    cancelOrder:     'Cancel & Start Over',
    orderSummary:    'Order Summary',
    shop:            'Shop',
    orderItems:      'Order Items',
    confirmOrder:    'Confirm & Place Order',
    cancel:          'Cancel',
    orderCreated:    'Order Created! 🎉',
    orderSuccess:    'Your order has been successfully submitted',
    newOrder:        'Record Another Order',
    errorTitle:      'Processing Failed',
    tryAgain:        'Try Again',
    items:           'items',
    qty:             'qty',
  },
};

// ── Animated Waveform bars (visual flair during recording) ───────────────────
const WaveformBars = ({ active }) => (
  <div className="flex items-center gap-0.5 h-8" aria-hidden>
    {Array.from({ length: 12 }).map((_, i) => (
      <span
        key={i}
        className={`w-1 rounded-full transition-all ${active ? 'bg-primary-400' : 'bg-surface-200'}`}
        style={{
          height: active
            ? `${20 + Math.sin(i * 0.9) * 10}px`
            : '6px',
          animationDelay: `${i * 60}ms`,
          animation: active ? 'wave 0.8s ease-in-out infinite alternate' : 'none',
          animationDelay: active ? `${i * 55}ms` : '0ms',
        }}
      />
    ))}
  </div>
);

const VoiceOrderPage = () => {
  const dispatch   = useDispatch();
  const step       = useSelector(selectVoiceStep);
  const sessionId  = useSelector(selectSessionId);
  const aiResponse = useSelector(selectAiResponse);
  const conversationLog = useSelector(selectConversationLog);
  const createdOrder = useSelector(selectCreatedOrder);
  const isLoading  = useSelector(selectVoiceLoading);
  const error      = useSelector(selectVoiceError);
  const lang       = useSelector(selectSelectedLanguage);
  const langMeta   = useSelector(selectSelectedLanguageMeta);

  const s = T[lang] || T.hinglish; // bilingual string lookup

  // Draft order for preview
  const draftOrder = createdOrder || aiResponse?.draft_order;

  const recorder = useAudioRecorder();
  const [textReply, setTextReply] = useState('');
  const chatEndRef = useRef(null);

  // Helper: get the right AI message for the chosen language
  const aiMessage = (response) =>
    lang === 'english' ? response?.message_en : (response?.message_local || response?.message_en);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationLog]);

  // Start session when entering IDLE state
  useEffect(() => {
    if (step === VOICE_STEPS.IDLE && !sessionId) {
      dispatch(startSession());
    }
  }, [step, sessionId, dispatch]);

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      if (sessionId) dispatch(terminateSession(sessionId));
    };
  }, [sessionId, dispatch]);

  // Speak AI reply in the right language
  useEffect(() => {
    if (aiResponse) {
      const text = aiMessage(aiResponse);
      if (text) speakText(text, lang);
    }
  }, [aiResponse, lang]);

  const handleStopAndProcess = async () => {
    recorder.stopRecording();
    await new Promise(r => setTimeout(r, 200));
    dispatch(setStep(VOICE_STEPS.RECORDED));
  };

  const handleSendAudio = async () => {
    if (!sessionId || !recorder.audioBlob) return;
    dispatch(addConversationMessage({ role: 'user', message: '[🎤 Voice message]' }));
    await dispatch(processAudio({ sessionId, audioBlob: recorder.audioBlob }));
  };

  const handleSendTextReply = async () => {
    if (!sessionId || !textReply.trim()) return;
    const reply = textReply.trim();
    setTextReply('');
    dispatch(addConversationMessage({ role: 'user', message: reply }));
    await dispatch(processReply({ sessionId, reply }));
  };

  const handleConfirmOrder = async () => {
    if (!sessionId) return;
    await dispatch(processReply({ sessionId, reply: 'yes' }));
  };

  const handleReset = () => {
    if (sessionId) dispatch(terminateSession(sessionId));
    recorder.resetRecording();
    setTextReply('');
    dispatch(resetVoiceOrder());
  };

  return (
    <DashboardLayout title={s.title}>
      {/* Keyframe animation injected inline */}
      <style>{`
        @keyframes wave {
          0%   { transform: scaleY(1); }
          100% { transform: scaleY(1.8); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        .pulse-ring { animation: pulse-ring 1.2s ease-out infinite; }
      `}</style>

      <div className="max-w-lg mx-auto space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-sm">
                <Mic size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-surface-900">{s.title}</h1>
            </div>
            <p className="text-sm text-surface-400 mt-0.5">{s.subtitle}</p>
          </div>
          <LanguageSelect />
        </div>

        {/* TTS unavailable warning — shown on browsers without Web Speech API */}
        {!isTTSSupported() && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <Volume2 size={13} className="shrink-0" />
            {lang === 'english'
              ? 'Voice playback not supported in this browser. AI replies will be shown as text only.'
              : 'Is browser mein voice playback support nahi hai. AI reply sirf text mein dikhega.'}
          </div>
        )}

        {/* ── IDLE / RECORDING / RECORDED ────────────────────────────────── */}
        {[VOICE_STEPS.IDLE, VOICE_STEPS.RECORDING, VOICE_STEPS.RECORDED].includes(step) && (
          <div className="rounded-2xl border border-surface-100 bg-white shadow-card-sm overflow-hidden">
            {/* Card top stripe */}
            <div className="h-1 w-full bg-gradient-to-r from-primary-400 via-primary-500 to-indigo-500" />

            <div className="p-6 flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="font-semibold text-surface-800">
                  {step === VOICE_STEPS.IDLE     ? s.readyTitle :
                   step === VOICE_STEPS.RECORDING ? s.recordingLabel : '✅ ' + (lang === 'english' ? 'Recording complete' : 'Recording complete')}
                </p>
                {step !== VOICE_STEPS.RECORDING && (
                  <p className="text-xs text-surface-400 mt-0.5">{s.readyHint}</p>
                )}
              </div>

              {/* Mic Button */}
              {step !== VOICE_STEPS.RECORDED && (
                <div className="relative flex items-center justify-center">
                  {/* Pulse rings */}
                  {recorder.isRecording && (
                    <>
                      <span className="absolute w-24 h-24 rounded-full bg-red-300 pulse-ring" style={{ animationDelay: '0ms' }} />
                      <span className="absolute w-24 h-24 rounded-full bg-red-200 pulse-ring" style={{ animationDelay: '400ms' }} />
                    </>
                  )}
                  <button
                    onClick={recorder.isRecording ? handleStopAndProcess : recorder.startRecording}
                    disabled={isLoading}
                    aria-label={recorder.isRecording ? s.stopLabel : s.readyHint}
                    className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 ${
                      recorder.isRecording
                        ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200'
                        : 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-200'
                    }`}
                  >
                    {recorder.isRecording
                      ? <span className="w-7 h-7 bg-white rounded-md" />
                      : <Mic size={30} className="text-white" />
                    }
                  </button>
                </div>
              )}

              {/* Waveform (visible during recording) */}
              {recorder.isRecording && (
                <div className="flex flex-col items-center gap-2">
                  <WaveformBars active={true} />
                  <span className="text-2xl font-mono font-bold text-surface-800 tabular-nums">
                    {recorder.durationFormatted}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {s.recordingLabel}
                  </div>
                </div>
              )}

              {/* Recorder error */}
              {recorder.error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl w-full">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-700">{recorder.error}</p>
                </div>
              )}

              {/* Recorded — playback + action buttons */}
              {step === VOICE_STEPS.RECORDED && recorder.audioUrl && (
                <div className="w-full space-y-3">
                  <audio
                    src={recorder.audioUrl}
                    controls
                    className="w-full h-10 rounded-lg"
                    style={{ accentColor: 'var(--color-primary-500, #6366f1)' }}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={handleReset} className="justify-center">
                      {s.retake}
                    </Button>
                    <Button variant="primary" onClick={handleSendAudio} isLoading={isLoading} className="justify-center">
                      {s.sendAudio}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PROCESSING ─────────────────────────────────────────────────── */}
        {step === VOICE_STEPS.PROCESSING && (
          <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-indigo-50 p-8 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-white border border-primary-100 shadow-sm flex items-center justify-center">
                <Loader2 size={28} className="text-primary-500 animate-spin" />
              </div>
              <Sparkles size={14} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-surface-800">{s.processingTitle}</p>
              <p className="text-xs text-surface-400 mt-1">{s.processingHint}</p>
            </div>
            <WaveformBars active={true} />
          </div>
        )}

        {/* ── CONVERSATION (clarification chat) ──────────────────────────── */}
        {step === VOICE_STEPS.CONVERSATION && aiResponse && (
          <div className="space-y-4">

            {/* Chat bubble — AI message */}
            <div className="rounded-2xl border border-surface-100 bg-white shadow-card-sm overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-indigo-400 to-primary-500" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <Sparkles size={13} className="text-primary-600" />
                  </div>
                  <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">{s.aiLabel}</span>
                </div>
                <div className="ml-9">
                  <p className="text-sm text-surface-800 leading-relaxed">
                    {aiMessage(aiResponse)}
                  </p>
                  {/* Show both language versions subtly */}
                  {aiResponse.message_en && aiResponse.message_local && (
                    <p className="text-xs text-surface-300 mt-2 italic">
                      {lang === 'english' ? aiResponse.message_local : aiResponse.message_en}
                    </p>
                  )}
                </div>

                {/* Speak button */}
                <button
                  onClick={() => speakText(aiMessage(aiResponse), lang)}
                  className="ml-9 flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary-500 transition-colors"
                >
                  <Volume2 size={12} />
                  {lang === 'english' ? 'Replay' : 'Dobara suno'}
                </button>
              </div>
            </div>

            {/* Reply box */}
            <div className="rounded-2xl border border-surface-100 bg-white shadow-card-sm p-4 space-y-4">
              <p className="text-xs font-bold text-surface-400 uppercase tracking-wide">{s.yourReply}</p>

              {/* Text input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textReply}
                  onChange={(e) => setTextReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendTextReply()}
                  placeholder={s.typeReply}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-sm border border-surface-200 rounded-xl bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all placeholder:text-surface-300"
                />
                <button
                  onClick={handleSendTextReply}
                  disabled={!textReply.trim() || isLoading}
                  className="w-10 h-10 flex-shrink-0 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-surface-100" />
                <span className="text-xs text-surface-300">{s.orLabel}</span>
                <div className="flex-1 h-px bg-surface-100" />
              </div>

              {/* Voice reply button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={recorder.isRecording ? handleStopAndProcess : recorder.startRecording}
                  disabled={isLoading}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all focus:outline-none focus:ring-4 ${
                    recorder.isRecording
                      ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200'
                      : 'bg-surface-800 hover:bg-surface-900 focus:ring-surface-200'
                  }`}
                >
                  {recorder.isRecording
                    ? <span className="w-4 h-4 bg-white rounded-sm" />
                    : <Mic size={20} className="text-white" />
                  }
                </button>
                {recorder.isRecording ? (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {recorder.durationFormatted}
                  </div>
                ) : (
                  <p className="text-xs text-surface-400">{s.voiceReply}</p>
                )}
              </div>

              {/* Recorded audio ready to send */}
              {step === VOICE_STEPS.RECORDED && recorder.audioUrl && (
                <div className="flex gap-2">
                  <audio src={recorder.audioUrl} controls className="flex-1 h-9 rounded-lg" />
                  <Button variant="primary" onClick={handleSendAudio} isLoading={isLoading}>
                    <Send size={14} />
                  </Button>
                </div>
              )}
            </div>

            {/* Cancel link */}
            <button
              onClick={handleReset}
              className="w-full text-xs text-surface-400 hover:text-red-500 transition-colors py-1"
            >
              {s.cancelOrder}
            </button>
          </div>
        )}

        {/* ── ERROR ─────────────────────────────────────────────────────── */}
        {step === VOICE_STEPS.ERROR && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-white border border-red-100 flex items-center justify-center">
              <AlertCircle size={26} className="text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-surface-800">{s.errorTitle}</p>
              <p className="text-xs text-surface-400 mt-1">{error}</p>
            </div>
            <Button variant="secondary" onClick={handleReset}>{s.tryAgain}</Button>
          </div>
        )}

        {/* ── PREVIEW ───────────────────────────────────────────────────── */}
        {step === VOICE_STEPS.PREVIEW && draftOrder && (
          <div className="space-y-4">

            {/* Order summary card */}
            <div className="rounded-2xl border border-surface-100 bg-white shadow-card-sm overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-5 space-y-4">
                <p className="text-xs font-bold text-surface-400 uppercase tracking-wide">{s.orderSummary}</p>

                {/* Shop row */}
                <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <Store size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">{s.shop}</p>
                    <p className="text-sm font-semibold text-surface-800">
                      {draftOrder.shopName || '—'}
                    </p>
                  </div>
                </div>

                {/* AI confirmation message */}
                {aiResponse && (aiMessage(aiResponse)) && (
                  <div className="flex items-start gap-2 p-3 bg-primary-50 rounded-xl border border-primary-100">
                    <Sparkles size={13} className="text-primary-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-surface-700">{aiMessage(aiResponse)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items list */}
            <div className="rounded-2xl border border-surface-100 bg-white shadow-card-sm overflow-hidden">
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-surface-50">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={15} className="text-surface-400" />
                  <p className="text-xs font-bold text-surface-400 uppercase tracking-wide">{s.orderItems}</p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-surface-100 text-surface-500 rounded-full font-medium">
                  {draftOrder.items?.length || 0} {s.items}
                </span>
              </div>
              <div className="divide-y divide-surface-50">
                {draftOrder.items?.map((item, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{item.productName}</p>
                      {item.variant_description && (
                        <p className="text-xs text-surface-400 mt-0.5">{item.variant_description}</p>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-surface-400">{s.qty}</span>
                      <span className="text-sm font-bold text-primary-600 min-w-[1.5rem] text-center">
                        ×{item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={handleReset} className="justify-center">
                {s.cancel}
              </Button>
              <button
                onClick={handleConfirmOrder}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    {s.confirmOrder}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── SUBMITTED ─────────────────────────────────────────────────── */}
        {step === VOICE_STEPS.SUBMITTED && (
          <div className="rounded-2xl overflow-hidden">
            {/* Green gradient header */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <CheckCircle2 size={44} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{s.orderCreated}</h2>
                <p className="text-emerald-100 text-sm mt-1">{s.orderSuccess}</p>
              </div>
            </div>

            {/* Order recap */}
            {createdOrder && (
              <div className="bg-white border border-t-0 border-surface-100 px-5 py-4 space-y-2">
                {createdOrder.shopName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-400">{s.shop}</span>
                    <span className="font-semibold text-surface-800">{createdOrder.shopName}</span>
                  </div>
                )}
                {createdOrder.items?.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-400">{s.items}</span>
                    <span className="font-semibold text-surface-800">{createdOrder.items.length}</span>
                  </div>
                )}
              </div>
            )}

            {/* New order button */}
            <div className="bg-white border border-t-0 border-surface-100 px-5 pb-5">
              <Button
                variant="secondary"
                onClick={handleReset}
                className="w-full justify-center"
                leftIcon={<RefreshCw size={15} />}
              >
                {s.newOrder}
              </Button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default VoiceOrderPage;