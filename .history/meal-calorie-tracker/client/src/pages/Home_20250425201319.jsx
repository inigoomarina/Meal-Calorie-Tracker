import { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Meal Calorie Tracker</h1>
        <p className="home-description">
          Track your meals, monitor your calorie intake, and achieve your nutrition goals with our simple and effective tools.
        </p>
        
        <div className="home-features">
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <h3>Track Calories</h3>
            <p>Monitor your daily calorie intake with an easy-to-use interface</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🥗</div>
            <h3>Log Meals</h3>
            <p>Quickly log your meals and access nutritional information</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📈</div>
            <h3>Track Progress</h3>
            <p>View your nutrition history and track your progress over time</p>
          </div>
        </div>
        
        <div className="home-actions">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-secondary">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
