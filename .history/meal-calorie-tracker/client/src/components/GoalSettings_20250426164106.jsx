import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import './GoalSettings.css';

const GoalSettings = ({ isOpen, onClose, onSave }) => {
  const { user, updateUser } = useContext(AuthContext);
  
  const [goals, setGoals] = useState({
    calorieGoal: 2000,
    proteinGoal: 100,
    carbsGoal: 150,
    fatGoal: 70
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load current user goals when component mounts or user changes
  useEffect(() => {
    if (user) {
      setGoals({
        calorieGoal: user.calorieGoal || 2000,
        proteinGoal: user.proteinGoal || 100,
        carbsGoal: user.carbsGoal || 150,
        fatGoal: user.fatGoal || 70
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGoals(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Update user profile with new goals
      await updateUser(goals);
      
      // Call the onSave callback with the new goals
      onSave(goals);
      
      setSuccessMessage('Goals updated successfully!');
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error saving goals:", err);
      setError('Failed to save goals. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Set Nutrition Goals</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <form onSubmit={handleSubmit} className="goal-settings-form">
          <div className="form-group">
            <label htmlFor="calorieGoal">
              Daily Calorie Goal
              <span className="input-description">Total calories per day</span>
            </label>
            <div className="input-with-unit">
              <input
                type="number"
                id="calorieGoal"
                name="calorieGoal"
                value={goals.calorieGoal}
                onChange={handleChange}
                min="500"
                max="10000"
                required
              />
              <span className="unit">cal</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="proteinGoal">
              Daily Protein Goal
              <span className="input-description">Recommended: 0.8-1.6g per kg of body weight</span>
            </label>
            <div className="input-with-unit">
              <input
                type="number"
                id="proteinGoal"
                name="proteinGoal"
                value={goals.proteinGoal}
                onChange={handleChange}
                min="10"
                max="500"
                required
              />
              <span className="unit">g</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="carbsGoal">
              Daily Carbs Goal
              <span className="input-description">Recommended: 45-65% of total calories</span>
            </label>
            <div className="input-with-unit">
              <input
                type="number"
                id="carbsGoal"
                name="carbsGoal"
                value={goals.carbsGoal}
                onChange={handleChange}
                min="20"
                max="500"
                required
              />
              <span className="unit">g</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="fatGoal">
              Daily Fat Goal
              <span className="input-description">Recommended: 20-35% of total calories</span>
            </label>
            <div className="input-with-unit">
              <input
                type="number"
                id="fatGoal"
                name="fatGoal"
                value={goals.fatGoal}
                onChange={handleChange}
                min="10"
                max="200"
                required
              />
              <span className="unit">g</span>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Goals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSettings;
