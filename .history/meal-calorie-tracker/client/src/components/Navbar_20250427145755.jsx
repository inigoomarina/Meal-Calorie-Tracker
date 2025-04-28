import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NavLink from './NavLink';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to={isAuthenticated() ? "/dashboard" : "/"} className="logo">
          Meal Tracker
        </NavLink>
      </div>
      <div className="navbar-menu">
        {isAuthenticated() ? (
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
            <Link to="/" className="navbar-item">Login</Link>
            <Link to="/register" className="navbar-item">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;