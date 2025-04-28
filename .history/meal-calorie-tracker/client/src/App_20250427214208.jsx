import React from 'react'; // Removed unused useContext import
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
// AuthProvider is removed from here, AuthContext might still be needed by children, keep import if so
import { AuthContext } from './context/AuthContext.jsx'; 
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

// Component to handle animated routes
const AnimatedRoutes = () => {
  const location = useLocation();
  // Removed useContext call here as well if it existed

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/log-meal" 
          element={
            <ProtectedRoute>
              <LogMeal />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meal-history" 
          element={
            <ProtectedRoute>
              <MealHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};


function App() {
  // Removed the useContext call for isAuthenticated here
  // const { isAuthenticated } = useContext(AuthContext); 

  return (
    <Router>
      {/* AuthProvider removed from here */}
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