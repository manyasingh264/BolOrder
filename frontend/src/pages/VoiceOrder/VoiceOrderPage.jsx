// pages/VoiceOrder/VoiceOrderPage.jsx — FULL IMPLEMENTATION
// Multi-step AI Voice Order wizard.
// Steps: IDLE → RECORDING → RECORDED → PROCESSING → PREVIEW → SUBMITTED

import { useDispatch, useSelector } from 'react-redux';
import { Mic, RefreshCw, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import AudioRecorder from '../../components/AudioRecorder/AudioRecorder';
import VoicePlayer from '../../components/VoicePlayer/VoicePlayer';
import { StatusBadge } from '../../components/Badge/Badge';

import {
  processVoiceOrder,
  resetVoiceOrder,
  setStep,
  setAudioBlob,
  selectVoiceStep,
  selectAiResult,
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
  const aiResult   = useSelector(selectAiResult);
  const isLoading  = useSelector(selectVoiceLoading);
  const error      = useSelector(selectVoiceError);

  const recorder = useAudioRecorder();

  const handleStopAndProcess = async () => {
    recorder.stopRecording();
    // Small delay for MediaRecorder.onstop to fire
    await new Promise(r => setTimeout(r, 200));
    dispatch(setStep(VOICE_STEPS.RECORDED));
  };

  const handleProcess = async () => {
    dispatch(setAudioBlob(recorder.audioBlob));
    await dispatch(processVoiceOrder(recorder.audioBlob));
  };

  const handleConfirmOrder = async () => {
    if (!aiResult) return;
    const orderPayload = {
      shopId: aiResult.shopId,
      items:  aiResult.items?.map((item) => ({
        productVariantId: item.productVariantId,
        quantity:         item.quantity,
      })),
    };
    const result = await dispatch(createOrder(orderPayload));
    if (createOrder.fulfilled.match(result)) {
      dispatch(setStep(VOICE_STEPS.SUBMITTED));
      dispatch(addToast({ message: 'Order created successfully!', type: 'success' }));
    } else {
      dispatch(addToast({ message: 'Failed to create order', type: 'error' }));
    }
  };

  const handleReset = () => {
    recorder.resetRecording();
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
          <p className="page-subtitle">Record your order in Hindi or Hinglish — AI will extract the details.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          {[
            ['Record',   [VOICE_STEPS.IDLE, VOICE_STEPS.RECORDING, VOICE_STEPS.RECORDED]],
            ['AI Process', [VOICE_STEPS.PROCESSING, VOICE_STEPS.PREVIEW]],
            ['Confirm',  [VOICE_STEPS.SUBMITTED]],
          ].map(([label, activeSteps], i) => {
            const isActive = activeSteps.includes(step);
            const isDone   = i === 0 && [VOICE_STEPS.PROCESSING, VOICE_STEPS.PREVIEW, VOICE_STEPS.SUBMITTED].includes(step)
                          || i === 1 && [VOICE_STEPS.SUBMITTED].includes(step);
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-px bg-surface-200" />}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isDone   ? 'bg-green-100 text-green-700' :
                  isActive ? 'bg-primary-100 text-primary-700' :
                             'bg-surface-100 text-surface-400'
                }`}>
                  {isDone ? <CheckCircle2 size={12} /> : <span>{i+1}</span>}
                  {label}
                </div>
              </div>
            );
          })}
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
                  {/* Using the AudioRecorder component for recording UI */}
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
                    <Button variant="primary" onClick={handleProcess} className="flex-1 justify-center">
                      Process with AI
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
                <p className="font-semibold text-surface-800">AI is processing your recording…</p>
                <p className="text-sm text-surface-400 mt-1">Extracting shop name, products, and quantities</p>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }} />
                ))}
              </div>
            </Card.Body>
          </Card>
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

        {/* ── PREVIEW (AI Result) ───────────────────────────────────────── */}
        {step === VOICE_STEPS.PREVIEW && aiResult && (
          <div className="space-y-4">
            {/* Transcript card */}
            <Card>
              <Card.Header>
                <h2 className="text-base font-semibold">AI Extracted Order</h2>
                <span className="badge badge-delivered">
                  {Math.round((aiResult.confidence ?? 0) * 100)}% confidence
                </span>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div className="p-3.5 bg-surface-50 rounded-xl border border-surface-200">
                  <p className="text-2xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Transcript</p>
                  <p className="text-sm text-surface-700 italic">"{aiResult.rawTranscript}"</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-surface-500">Shop:</span>
                  <span className="font-semibold text-surface-800">{aiResult.shopName}</span>
                </div>
              </Card.Body>
            </Card>

            {/* Items card */}
            <Card>
              <Card.Header>
                <h2 className="text-base font-semibold">Order Items</h2>
                <span className="text-sm text-surface-400">{aiResult.items?.length} items</span>
              </Card.Header>
              <div className="divide-y divide-surface-100">
                {aiResult.items?.map((item, i) => (
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
                  {formatCurrency(aiResult.items?.reduce((sum, i) => sum + parseFloat(i.subtotal || 0), 0))}
                </span>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleReset} className="flex-1 justify-center">
                Record Again
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
                <p className="text-surface-500 mt-1 text-sm">The order has been successfully submitted for {aiResult?.shopName}.</p>
              </div>
              <div className="flex gap-3 w-full justify-center">
                <Button variant="secondary" onClick={handleReset} leftIcon={<RefreshCw size={15} />}>
                  Record Another
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
