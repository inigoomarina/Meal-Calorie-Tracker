import React, { useContext } from 'react'; // Removed unused useRef import
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar.jsx'; // Import Navbar
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LogMeal from './pages/LogMeal';
import MealHistory from './pages/MealHistory';
import Profile from './pages/Profile';
import { SafeCSSTransition, SafeTransitionGroup, DURATION } from './components/TransitionWrapper.jsx';
import './App.css';

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user, loading } = useContext(AuthContext);
  // Ref is managed by SafeCSSTransition wrapper

  // Define routes configuration
  const routesConfig = [
    { path: '/', element: <Home />, requiresAuth: false },
    { path: '/login', element: <Login />, requiresAuth: false },
    { path: '/register', element: <Register />, requiresAuth: false },
    { path: '/dashboard', element: <Dashboard />, requiresAuth: true },
    { path: '/log-meal', element: <LogMeal />, requiresAuth: true },
    { path: '/meal-history', element: <MealHistory />, requiresAuth: true },
    { path: '/profile', element: <Profile />, requiresAuth: true },
  ];

  return (
    <SafeTransitionGroup component={null}>
      <SafeCSSTransition
        key={location.pathname}
        classNames="page"
        timeout={DURATION.FADE}
        unmountOnExit // Add this prop
      >
        <div className="page-container"> {/* This div receives the ref */}
          <Routes location={location}>
            {routesConfig.map(({ path, element, requiresAuth }) => (
              <Route
                key={path}
                path={path}
                element={
                  requiresAuth ? (
                    <ProtectedRoute user={user} loading={loading}>
                      {element}
                    </ProtectedRoute>
                  ) : (
                    element
                  )
                }
              />
            ))}
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </SafeCSSTransition>
    </SafeTransitionGroup>
  );
};


function App() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Router>
      <AuthProvider> {/* AuthProvider needs to wrap everything that uses AuthContext */}
        <div className="App">
          <Navbar /> {/* Navbar can now be used */}
          <main>
            <AnimatedRoutes />
          </main>
          {/* Optional: Add a Footer component here */}
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;