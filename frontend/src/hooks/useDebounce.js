// hooks/useDebounce.js
//
// Why it exists: Search bars should not fire an API call on every keystroke.
//               This hook delays the value update by `delay` milliseconds.
// Responsibility: Returns a debounced version of any value.
// Used by: SearchBar component (all pages with search)

import { useState, useEffect } from 'react';

const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer); // cleanup on next keystroke
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
