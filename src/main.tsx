import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { LocaleProvider } from './contexts/LocaleContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </AuthProvider>
  </StrictMode>,
);
