import { Routes, Route, useLocation, BrowserRouter as Router, Navigate } from 'react-router-dom'; // Added Router and Navigate
import { useContext } from 'react'; // Added useContext
import { AuthProvider, AuthContext } from './context/AuthContext.jsx'; // Changed path
import { SafeCSSTransition, SafeTransitionGroup, DURATION } from './components/TransitionWrapper.jsx'; // Changed path
import Header from './components/Header.jsx'; // Changed path
import Footer from './components/Footer.jsx'; // Changed path
import ProtectedRoute from './components/ProtectedRoute.jsx'; // Changed path
import Home from './pages/Home.jsx'; // Changed path
import Login from './pages/Login.jsx'; // Changed path
import Register from './pages/Register.jsx'; // Changed path
import Dashboard from './pages/Dashboard.jsx'; // Changed path
import LogMeal from './pages/LogMeal.jsx'; // Changed path
import MealHistory from './pages/MealHistory.jsx'; // Changed path
import Profile from './pages/Profile.jsx'; // Changed path
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
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          <div className="content">
            <AnimatedRoutes />
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;