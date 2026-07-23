// components/LanguageSelect/LanguageSelect.jsx
// Premium pill-toggle for switching between Hinglish and English.
// Replaces the old dropdown — only two languages are supported.

import { useDispatch, useSelector } from 'react-redux';
import { selectSelectedLanguage, toggleLanguage } from '../../redux/slices/voiceSettingSlice';

const LanguageSelect = ({ className = '' }) => {
  const dispatch = useDispatch();
  const selected = useSelector(selectSelectedLanguage);
  const isEnglish = selected === 'english';

  return (
    <button
      onClick={() => dispatch(toggleLanguage())}
      title={isEnglish ? 'Switch to Hinglish' : 'Switch to English'}
      aria-label={`Language: ${selected}. Click to switch.`}
      className={`relative flex items-center gap-0.5 p-1 rounded-full border border-surface-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 select-none ${className}`}
      style={{ minWidth: 120 }}
    >
      {/* Sliding pill indicator */}
      <span
        className="absolute top-1 bottom-1 rounded-full bg-primary-500 transition-all duration-250 ease-in-out"
        style={{
          width: 'calc(50% - 4px)',
          left: isEnglish ? 'calc(50% + 2px)' : '4px',
        }}
      />

      {/* Hinglish tab */}
      <span
        className={`relative z-10 flex-1 text-center text-xs font-semibold py-1.5 px-2 rounded-full transition-colors duration-200 ${
          !isEnglish ? 'text-white' : 'text-surface-500'
        }`}
      >
        🇮🇳 हिं/EN
      </span>

      {/* English tab */}
      <span
        className={`relative z-10 flex-1 text-center text-xs font-semibold py-1.5 px-2 rounded-full transition-colors duration-200 ${
          isEnglish ? 'text-white' : 'text-surface-500'
        }`}
      >
        🇬🇧 EN
      </span>
    </button>
  );
};

export default LanguageSelect;