import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css'; // Changed from index.css to App.css
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);