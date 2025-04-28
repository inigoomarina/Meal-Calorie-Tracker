import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import { useContext } from 'react';

import Navbar from './components/Navbar'; // Removed .jsx
import Footer from './components/Footer'; // Removed .jsx
import Dashboard from './pages/Dashboard.jsx';
import LogMeal from './pages/LogMeal.jsx';
import MealHistory from './pages/MealHistory.jsx'; // Import MealHistory
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

import './App.css';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div className="loading">Loading user...</div>; // Or a spinner component
  }

  return user ? children : <Navigate to="/login" />;
};

// PublicRoute component to redirect logged-in users from login/register
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div className="loading">Loading user...</div>; // Or a spinner component
  }

  return user ? <Navigate to="/dashboard" /> : children;
};


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              {/* Private Routes */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/log-meal" element={<PrivateRoute><LogMeal /></PrivateRoute>} />
              <Route path="/meal-history" element={<PrivateRoute><MealHistory /></PrivateRoute>} /> {/* Add Meal History Route */}
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              
              {/* Catch-all for 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;