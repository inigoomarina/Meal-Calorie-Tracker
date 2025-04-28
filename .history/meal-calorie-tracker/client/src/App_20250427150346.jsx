import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LogMeal from './pages/LogMeal';
import MealHistory from './pages/MealHistory';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { SafeTransitionGroup, SafeTransition } from './components/TransitionWrapper';

// Create an AnimatedRoutes component that handles the route transitions
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <SafeTransitionGroup>
      <SafeTransition key={location.key} timeout={300}>
        <Routes location={location}>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/log-meal" 
            element={
              <PrivateRoute>
                <LogMeal />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/meal-history" 
            element={
              <PrivateRoute>
                <MealHistory />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SafeTransition>
    </SafeTransitionGroup>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app loading/initializing
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <main className="container">
          <AnimatedRoutes />
        </main>
      </AuthProvider>
    </Router>
  );
}

export default App;