// redux/slices/voiceSettingSlice.js
//
// Responsibility: holds the salesman's chosen conversation language.
// Only two languages supported: Hinglish and English.
// Persisted to localStorage so it survives refresh.

import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'bolorder_voice_language';

const loadInitial = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'english' ? 'english' : 'hinglish'; // default to hinglish
  } catch {
    return 'hinglish';
  }
};

export const LANGUAGES = [
  {
    value:      'hinglish',
    label:      'हिं / EN',
    fullLabel:  'Hinglish',
    speechLang: 'hi-IN',
    flag:       '🇮🇳',
    hint:       'Hindi + English mix',
  },
  {
    value:      'english',
    label:      'English',
    fullLabel:  'English',
    speechLang: 'en-IN',
    flag:       '🇬🇧',
    hint:       'English only',
  },
];

const voiceSettingsSlice = createSlice({
  name: 'voiceSettings',
  initialState: {
    selectedLanguage: loadInitial(),
  },
  reducers: {
    setSelectedLanguage: (state, action) => {
      const val = action.payload;
      if (val === 'english' || val === 'hinglish') {
        state.selectedLanguage = val;
        try { localStorage.setItem(STORAGE_KEY, val); } catch { /* non-fatal */ }
      }
    },
    toggleLanguage: (state) => {
      state.selectedLanguage = state.selectedLanguage === 'hinglish' ? 'english' : 'hinglish';
      try { localStorage.setItem(STORAGE_KEY, state.selectedLanguage); } catch { /* non-fatal */ }
    },
  },
});

export const { setSelectedLanguage, toggleLanguage } = voiceSettingsSlice.actions;

export const selectSelectedLanguage     = (state) => state.voiceSettings.selectedLanguage;
export const selectSelectedLanguageMeta = (state) =>
  LANGUAGES.find((l) => l.value === state.voiceSettings.selectedLanguage) || LANGUAGES[0];
export const selectIsEnglish = (state) => state.voiceSettings.selectedLanguage === 'english';

export default voiceSettingsSlice.reducer;