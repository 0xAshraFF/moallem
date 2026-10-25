import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PrefsProvider } from './lib/prefs';
import { LocationProvider } from './lib/location';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrefsProvider>
      <LocationProvider>
        <App />
      </LocationProvider>
    </PrefsProvider>
  </StrictMode>,
);
