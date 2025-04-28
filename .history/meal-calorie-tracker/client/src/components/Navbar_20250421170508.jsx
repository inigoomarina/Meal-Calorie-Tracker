import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to={isAuthenticated() ? '/dashboard' : '/'}>
          Meal Calories Tracker
        </Link>
      </div>
      <div className="navbar-menu">
        {isAuthenticated() ? (
          <>
            <Link to="/dashboard" className="navbar-item">Dashboard</Link>
            <Link to="/log-meal" className="navbar-item">Log Meal</Link>
            <Link to="/meal-history" className="navbar-item">Meal History</Link>
            <div className="navbar-item user-info">
              <span>Welcome, {user?.name || 'User'}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/" className="navbar-item">Login</Link>
            <Link to="/register" className="navbar-item">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;