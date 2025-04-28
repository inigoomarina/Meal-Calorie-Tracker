import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // Import AuthProvider
import './index.css';
import './App.css'; // Ensure App.css is imported if it contains global styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Wrap App with AuthProvider */}
    <AuthProvider> 
      <App />
    </AuthProvider>
  </React.StrictMode>,
);