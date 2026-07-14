// components/AudioRecorder/AudioRecorder.jsx
//
// Why it exists: Voice order recording UI is complex — mic button, timer, waveform animation.
//               Isolating it here keeps VoiceOrderWizard clean.
// Responsibility: Show record/stop button + live timer + mic animation; emit audioBlob.
// Used by: features/voice/StepRecord.jsx → VoiceOrderWizard

import { Mic, Square, AlertCircle } from 'lucide-react';
import useAudioRecorder from '../../hooks/useAudioRecorder';

const AudioRecorder = ({ onRecordingComplete }) => {
  const {
    isRecording,
    audioBlob,
    durationFormatted,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const handleStop = () => {
    stopRecording();
    // audioBlob is set asynchronously after MediaRecorder.onstop fires
    // We pass it up via a small delay to ensure the blob is ready
    setTimeout(() => {
      if (onRecordingComplete) {
        // Will be called from StepRecord with a ref to audioBlob
      }
    }, 100);
  };

  // Waveform bars (decorative animation during recording)
  const WaveformBars = () => (
    <div className="flex items-center gap-0.5 h-8">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-1 bg-primary-500 rounded-full waveform-bar"
          style={{
            height: `${30 + Math.sin(i * 0.8) * 20}px`,
            animationDelay: `${i * 0.08}s`,
            animationDuration: `${0.6 + (i % 3) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Main Record / Stop Button */}
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-red-400 recording-pulse scale-125 opacity-30" />
        )}
        <button
          onClick={isRecording ? handleStop : startRecording}
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-card-md transition-all duration-200 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-primary-500 hover:bg-primary-600 text-white'
          }`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording
            ? <Square size={28} fill="white" />
            : <Mic size={28} />
          }
        </button>
      </div>

      {/* Status / Timer */}
      {isRecording ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-600">Recording…</span>
          </div>
          <span className="text-3xl font-mono font-bold text-surface-800">
            {durationFormatted}
          </span>
          <WaveformBars />
        </div>
      ) : audioBlob ? (
        <div className="text-center">
          <p className="text-sm font-medium text-green-600">✓ Recording complete</p>
          <p className="text-xs text-surface-400 mt-0.5">Duration: {durationFormatted}</p>
          <button
            onClick={resetRecording}
            className="text-xs text-primary-500 hover:text-primary-600 mt-2 underline"
          >
            Record again
          </button>
        </div>
      ) : (
        <p className="text-sm text-surface-500">
          Tap the mic to start recording your order in Hindi/Hinglish
        </p>
      )}

      {/* Mic permission error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg max-w-xs">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
