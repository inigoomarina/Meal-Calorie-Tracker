import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import NavLink from './NavLink.jsx';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to={isAuthenticated() ? "/dashboard" : "/"} className="logo">
          <i className="fas fa-utensils"></i> Meal Tracker
        </NavLink>
      </div>
      
      <div className="navbar-menu">
        {isAuthenticated() ? (
          <>
            <NavLink to="/dashboard" className="navbar-item">Dashboard</NavLink>
            <NavLink to="/log-meal" className="navbar-item">Log Meal</NavLink>
            <NavLink to="/meal-history" className="navbar-item">Meal History</NavLink>
            <NavLink to="/settings" className="navbar-item">Settings</NavLink>
            <button onClick={handleLogout} className="btn btn-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/" className="navbar-item">Login</NavLink>
            <NavLink to="/register" className="navbar-item">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;