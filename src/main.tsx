import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import './styles.css';

// Service worker: permite instalar la app y usarla sin conexión.
registerSW({ immediate: true });

// Pide al navegador que no borre los datos locales si anda justo de espacio.
void navigator.storage?.persist?.();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
