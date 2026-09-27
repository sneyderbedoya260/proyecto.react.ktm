import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ContenidoProvider } from './context/ContenidoContext';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ContenidoProvider>
          <App />
        </ContenidoProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);