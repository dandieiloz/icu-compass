// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Import 3rd-party CSS here, before your own styles
import 'react-tabs/style/react-tabs.css';

// Your global styles are imported last to ensure they can override the library styles
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);