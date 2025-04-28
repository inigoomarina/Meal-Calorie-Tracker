import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LogMeal from './pages/LogMeal.jsx';
import MealHistory from './pages/MealHistory.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import './App.css';
import { SafeTransitionGroup, SafeTransition, DURATION } from './components/TransitionWrapper.jsx';

// AnimatedRoutes component to handle route transitions
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <SafeTransitionGroup>
      <SafeTransition
        key={location.pathname}
        timeout={DURATION.FADE}
      >
        {(state) => (
          <div style={{
            transition: `opacity ${DURATION.FADE}ms ease-in-out`,
            opacity: state === 'entering' || state === 'entered' ? 1 : 0,
          }}>
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
                path="/settings" 
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        )}
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