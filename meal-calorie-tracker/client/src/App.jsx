import { Route, Routes, useLocation } from 'react-router-dom'; // Keep Router import if needed for type checking, but don't use <Router> here
import { useContext } from 'react';
import { AuthProvider, AuthContext } from '@/context/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Home from '@/pages/Home.jsx';
import Login from '@/pages/Login.jsx';
import Register from '@/pages/Register.jsx';
import Dashboard from '@/pages/Dashboard.jsx';
import LogMeal from '@/pages/LogMeal.jsx';
import MealHistory from '@/pages/MealHistory.jsx';
// import Profile from '@/pages/Profile.jsx'; // Remove this line
// Assuming NotFound component exists or is created
// import NotFound from '@/pages/NotFound.jsx';
import './App.css';

// AppContent component uses hooks that require Router context
function AppContent() {
  const { loading } = useContext(AuthContext);
  const location = useLocation();

  const hideHeaderFooterPaths = ['/login', '/register'];
  const hideHeaderFooter = hideHeaderFooterPaths.includes(location.pathname);

  if (loading) {
    return <div className="loading">Loading Application...</div>;
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
          {/* Remove the Profile route */}
          {/* <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          /> */}
          {/* Add a NotFound route if desired */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

// The main App component that sets up providers
// It should NOT render a <Router> itself.
function App() {
  return (
    <AuthProvider>
      {/* BrowserRouter should wrap AppContent */}
      {/* If BrowserRouter is in main.jsx, this is correct */}
      <AppContent />
    </AuthProvider>
  );
}

export default App;