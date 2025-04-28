import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LogMeal from './pages/LogMeal';
import MealHistory from './pages/MealHistory';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="App">
      {!hideHeaderFooter && <Header />}
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/log-meal" element={<LogMeal />} />
            <Route path="/meal-history" element={<MealHistory />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch-all or Not Found Route (Optional) */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

export default App;