import React from 'react'; // Removed unused useContext import
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
// AuthProvider is no longer needed here, it's in main.jsx
// AuthContext is also not used directly in App anymore
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar.jsx'; 
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LogMeal from './pages/LogMeal';
import MealHistory from './pages/MealHistory';
import Profile from './pages/Profile';
import { AnimatePresence } from 'framer-motion';

// AnimatedRoutes component remains the same
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/log-meal" element={<ProtectedRoute><LogMeal /></ProtectedRoute>} />
        <Route path="/meal-history" element={<ProtectedRoute><MealHistory /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};


function App() {
  return (
    <Router>
      <div className="App">
        <Navbar /> {/* Navbar can now be used */}
        <main>
          <AnimatedRoutes />
        </main>
        {/* Optional: Add a Footer component here */}
      </div>
    </Router>
  );
}

export default App;