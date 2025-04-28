import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import NavLink from './NavLink';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to={user ? "/dashboard" : "/"} className="brand-logo">
          Meal Tracker
        </NavLink>
      </div>
      
      <div className="navbar-menu">
        {user ? (
          <>
            <NavLink to="/dashboard" className="navbar-item">Dashboard</NavLink>
            <NavLink to="/log-meal" className="navbar-item">Log Meal</NavLink>
            <NavLink to="/meal-history" className="navbar-item">History</NavLink>
            <NavLink to="/profile" className="navbar-item">Profile</NavLink>
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