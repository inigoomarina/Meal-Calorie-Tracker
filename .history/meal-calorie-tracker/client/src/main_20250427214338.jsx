import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router
import { AuthProvider } from './context/AuthContext.jsx'; // Import AuthProvider
import App from './App.jsx';
import './index.css'; // Or your main CSS file

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Router should wrap AuthProvider */}
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);