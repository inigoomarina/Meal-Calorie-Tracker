import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from '/src/context/AuthContext.jsx';
import { SafeCSSTransition, SafeTransitionGroup, DURATION } from '/src/components/TransitionWrapper.jsx';
import Header from '/src/components/Header.jsx';
import Footer from '/src/components/Footer.jsx';
import ProtectedRoute from '/src/components/ProtectedRoute.jsx';
import Home from '/src/pages/Home.jsx';
import Login from '/src/pages/Login.jsx';
import Register from '/src/pages/Register.jsx';
import Dashboard from '/src/pages/Dashboard.jsx';
import LogMeal from '/src/pages/LogMeal.jsx';
import MealHistory from '/src/pages/MealHistory.jsx';
import Profile from '/src/pages/Profile.jsx';
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