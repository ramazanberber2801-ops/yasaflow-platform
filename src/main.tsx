import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './owner-v2.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register PWA service worker + update prompt
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            const shouldUpdate = confirm(
              'Yeni sürüm mevcut. Şimdi güncellemek ister misiniz?'
            );

            if (shouldUpdate) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });
    } catch {
      // ignore service worker registration errors
    }
  });
}
