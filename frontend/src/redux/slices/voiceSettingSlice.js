// redux/slices/voiceSettingsSlice.js
//
// Responsibility: holds the salesman's chosen conversation language.
// Persisted to localStorage so it survives refresh/logout.

import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'bolorder_voice_language';

const loadInitial = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'hinglish';
  } catch {
    return 'hinglish';
  }
};

export const LANGUAGES = [
  { value: 'hinglish', label: 'Hinglish', speechLang: 'hi-IN' },
  { value: 'english',  label: 'English',  speechLang: 'en-IN' },
  { value: 'bengali',  label: 'Bengali',  speechLang: 'bn-IN' },
  { value: 'marathi',  label: 'Marathi',  speechLang: 'mr-IN' },
];

const voiceSettingsSlice = createSlice({
  name: 'voiceSettings',
  initialState: {
    selectedLanguage: loadInitial(),
  },
  reducers: {
    setSelectedLanguage: (state, action) => {
      state.selectedLanguage = action.payload;
      try {
        localStorage.setItem(STORAGE_KEY, action.payload);
      } catch {
        // localStorage unavailable — non-fatal
      }
    },
  },
});

export const { setSelectedLanguage } = voiceSettingsSlice.actions;

export const selectSelectedLanguage = (state) => state.voiceSettings.selectedLanguage;
export const selectSelectedLanguageMeta = (state) =>
  LANGUAGES.find((l) => l.value === state.voiceSettings.selectedLanguage) || LANGUAGES[0];

export default voiceSettingsSlice.reducer;