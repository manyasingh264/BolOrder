// main.jsx — application entry point.
//
// Responsibility: Mount the React app with all required providers.
//
// Provider order (outermost → innermost):
//   1. StrictMode        → catches accidental side effects in development
//   2. Provider (Redux)  → makes the store available to every component
//   3. BrowserRouter     → enables React Router navigation
//   4. App               → the root component with all routes

import { StrictMode }   from 'react';
import { createRoot }   from 'react-dom/client';
import { Provider }     from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import store  from './redux/store';
import App    from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
