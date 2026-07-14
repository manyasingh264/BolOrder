// components/VoicePlayer/VoicePlayer.jsx
//
// Why it exists: After recording, the salesman needs to preview their audio.
//               This wraps the HTML5 <audio> element with consistent styling.
// Responsibility: Render a styled audio player for a given audioUrl.
// Used by: features/voice/StepPreview.jsx

import { Volume2 } from 'lucide-react';

const VoicePlayer = ({ audioUrl, duration }) => {
  if (!audioUrl) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-surface-50 border border-surface-200 rounded-xl">
      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
        <Volume2 size={18} className="text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-700 mb-1.5">Recorded Audio</p>
        <audio
          controls
          src={audioUrl}
          className="w-full h-8"
          style={{ accentColor: '#f97316' }}
        />
      </div>
      {duration && (
        <span className="text-xs text-surface-400 flex-shrink-0">{duration}</span>
      )}
    </div>
  );
};

export default VoicePlayer;
