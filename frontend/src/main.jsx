import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        success: { style: { background: '#057642', color: '#fff' } },
        error:   { style: { background: '#cc1016', color: '#fff' } },
        duration: 3000,
      }}
    />
  </React.StrictMode>
);
