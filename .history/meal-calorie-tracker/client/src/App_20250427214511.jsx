import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LogMeal from './pages/LogMeal.jsx';
import MealHistory from './pages/MealHistory.jsx';
import Profile from './pages/Profile.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
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