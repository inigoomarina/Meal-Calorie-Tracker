import { useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext.jsx'; // Ensure path is correct

const Header = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-item">Meal Tracker</Link>
      </div>
      <nav className="navbar-menu">
        {isAuthenticated() ? (
          <>
            <NavLink to="/dashboard" className="navbar-item" activeClassName="active">Dashboard</NavLink>
            <NavLink to="/log-meal" className="navbar-item" activeClassName="active">Log Meal</NavLink>
            <NavLink to="/meal-history" className="navbar-item" activeClassName="active">History</NavLink>
            <div className="user-info">
              <span className="navbar-item">Welcome, {user?.name || 'User'}</span>
              <button onClick={logout} className="btn btn-logout">Logout</button>
            </div>
          </>
        ) : (
          <>
            <NavLink to="/login" className="navbar-item" activeClassName="active">Login</NavLink>
            <NavLink to="/register" className="navbar-item" activeClassName="active">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
