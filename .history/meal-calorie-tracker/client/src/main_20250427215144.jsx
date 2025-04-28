import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext.jsx'; // Ensure path is correct
import './index.css'; // Or your main CSS entry point

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Single top-level Router */}
    <BrowserRouter>
      {/* AuthProvider wraps App to provide context */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);