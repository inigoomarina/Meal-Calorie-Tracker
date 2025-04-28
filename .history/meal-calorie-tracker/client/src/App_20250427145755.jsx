import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SafeTransition, SafeTransitionGroup } from './components/TransitionWrapper';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import MealHistory from './pages/MealHistory';
import LogMeal from './pages/LogMeal';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';

// Transitions for page animations
const TRANSITION_STYLES = {
  entering: { opacity: 0, transform: 'translateY(20px)' },
  entered: { opacity: 1, transform: 'translateY(0)' },
  exiting: { opacity: 0, transform: 'translateY(20px)' },
  exited: { opacity: 0, transform: 'translateY(20px)' },
};

// AnimatedRoutes component that wraps each route in a transition
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <SafeTransitionGroup>
      <SafeTransition
        key={location.pathname}
        timeout={300}
        classNames="page-transition"
      >
        {(state) => (
          <div style={{
            ...TRANSITION_STYLES[state],
            transition: 'opacity 300ms, transform 300ms',
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
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
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
}

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Navbar />
        <main className="container">
          <AnimatedRoutes />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;