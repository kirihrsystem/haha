import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { registerSW } from 'virtual:pwa-register';
import { initSecurity } from './utils/security';

initSecurity();

// Safe service worker registration
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({
      immediate: true,
      onRegisterError(error) {
        console.warn('Service worker registration failed or blocked by iframe context:', error);
      }
    });
  } catch (err) {
    console.warn('Service worker not supported in this environment:', err);
  }
}

// Suppress benign preview / iframe cross-origin and websocket errors
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
    (typeof event.reason === 'string' && event.reason.includes('WebSocket')) ||
    (event.reason.message && event.reason.message.includes('WebSocket closed without opened')) ||
    (event.reason.message && event.reason.message.includes('Script error'))
  )) {
    event.preventDefault();
  }
});

const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Detected an update time that is in the future')) {
    return;
  }
  originalConsoleError(...args);
};

window.addEventListener('error', (event) => {
  if (event.message === 'Script error.' || event.message?.includes('Script error')) {
    // Suppress cross-origin script error notifications in iframe
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
