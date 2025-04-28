import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    dailyCalorieGoal: user?.calorieGoal || 2000,
    theme: 'light'
  });
  
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('Settings saved successfully! (Note: This is a placeholder, actual saving functionality will be implemented later)');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      
      {message && <div className="success-message">{message}</div>}
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="dailyCalorieGoal">Daily Calorie Goal</label>
            <input
              type="number"
              id="dailyCalorieGoal"
              name="dailyCalorieGoal"
              value={settings.dailyCalorieGoal}
              onChange={handleChange}
              min="500"
              max="10000"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              name="theme"
              value={settings.theme}
              onChange={handleChange}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary">
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
