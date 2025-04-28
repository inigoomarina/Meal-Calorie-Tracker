import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from '@/context/AuthContext.jsx'; // Changed path
import ProtectedRoute from '@/components/ProtectedRoute.jsx'; // Changed path
import Header from '@/components/Header.jsx'; // Verify this path points to the newly created file
import Footer from '@/components/Footer.jsx'; // Changed path
import Home from '@/pages/Home.jsx'; // Changed path
import Login from '@/pages/Login.jsx'; // Changed path
import Register from '@/pages/Register.jsx'; // Changed path
import Dashboard from '@/pages/Dashboard.jsx'; // Changed path
import LogMeal from '@/pages/LogMeal.jsx'; // Changed path
import MealHistory from '@/pages/MealHistory.jsx'; // Changed path
import Profile from '@/pages/Profile.jsx'; // Changed path
import './App.css'; // Ensure global styles are imported

function AppContent() {
  const { loading } = useContext(AuthContext);
  const location = useLocation();

  // Paths where header/footer should be hidden (e.g., login, register)
  const hideHeaderFooterPaths = ['/login', '/register'];
  const hideHeaderFooter = hideHeaderFooterPaths.includes(location.pathname);

  if (loading) {
    return <div className="loading">Loading Application...</div>; // Or a more sophisticated loading spinner
  }

  return (
    <div className="App">
      {!hideHeaderFooter && <Header />}
      <main className="container">
        <Routes>
          {/* Public Routes */}
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
          {/* Add other protected routes here */}

          {/* Fallback for unknown routes */}
          <Route path="*" element={<NotFound />} /> 
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;