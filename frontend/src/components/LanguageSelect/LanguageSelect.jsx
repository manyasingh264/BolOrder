// components/LanguageSelect/LanguageSelect.jsx
// Dropdown for choosing the voice-order conversation language.

import { useDispatch, useSelector } from 'react-redux';
import { Languages } from 'lucide-react';
import { LANGUAGES, selectSelectedLanguage, setSelectedLanguage } from '../../redux/slices/voiceSettingSlice';

const LanguageSelect = () => {
  const dispatch = useDispatch();
  const selected = useSelector(selectSelectedLanguage);

  return (
    <div className="flex items-center gap-2">
      <Languages size={16} className="text-surface-400" />
      <select
        value={selected}
        onChange={(e) => dispatch(setSelectedLanguage(e.target.value))}
        className="text-sm border border-surface-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>{lang.label}</option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelect;