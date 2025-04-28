import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // Import AuthProvider
import './index.css';
import './App.css'; // Ensure App.css is imported

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* AuthProvider should wrap App to provide context */}
    <AuthProvider> 
      <App />
    </AuthProvider>
  </React.StrictMode>,
);