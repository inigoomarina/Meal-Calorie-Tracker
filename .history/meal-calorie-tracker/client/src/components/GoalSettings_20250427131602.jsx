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
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load current goals from user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setGoals({
        calorieGoal: user.calorieGoal || 2000,
        proteinGoal: user.proteinGoal || 100,
        carbsGoal: user.carbsGoal || 150,
        fatGoal: user.fatGoal || 70
      });
      
      // Reset messages
      setError('');
      setSuccess('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGoals(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      console.log("Saving new goals:", goals);
      
      // Update user profile through AuthContext
      await updateUser(goals);
      
      // Show success message
      setSuccess('Your nutrition goals have been updated successfully!');
      
      // Call the onSave callback from parent component
      if (onSave) {
        onSave(goals);
      }
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to save goals:", err);
      setError("Failed to save your goals. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="goal-settings-overlay">
      <div className="goal-settings-modal">
        <div className="goal-settings-header">
          <h2>Set Nutrition Goals</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="goal-form-grid">
            <div className="goal-form-group">
              <label htmlFor="calorieGoal">
                Daily Calories
                <div className="slider-value">{goals.calorieGoal} cal</div>
              </label>
              <input
                type="range"
                name="calorieGoal"
                id="calorieGoal"
                min="1200"
                max="5000"
                step="50"
                value={goals.calorieGoal}
                onChange={handleChange}
                className="goal-slider"
              />
              <div className="goal-input-group">
                <input
                  type="number"
                  name="calorieGoal"
                  value={goals.calorieGoal}
                  onChange={handleChange}
                  min="0"
                  className="goal-number-input"
                />
                <span className="unit">cal</span>
              </div>
            </div>
            
            <div className="goal-form-group">
              <label htmlFor="proteinGoal">
                Protein Goal
                <div className="slider-value">{goals.proteinGoal} g</div>
              </label>
              <input
                type="range"
                name="proteinGoal"
                id="proteinGoal"
                min="30"
                max="300"
                step="5"
                value={goals.proteinGoal}
                onChange={handleChange}
                className="goal-slider"
              />
              <div className="goal-input-group">
                <input
                  type="number"
                  name="proteinGoal"
                  value={goals.proteinGoal}
                  onChange={handleChange}
                  min="0"
                  className="goal-number-input"
                />
                <span className="unit">g</span>
              </div>
            </div>
            
            <div className="goal-form-group">
              <label htmlFor="carbsGoal">
                Carbs Goal
                <div className="slider-value">{goals.carbsGoal} g</div>
              </label>
              <input
                type="range"
                name="carbsGoal"
                id="carbsGoal"
                min="50"
                max="500"
                step="5"
                value={goals.carbsGoal}
                onChange={handleChange}
                className="goal-slider"
              />
              <div className="goal-input-group">
                <input
                  type="number"
                  name="carbsGoal"
                  value={goals.carbsGoal}
                  onChange={handleChange}
                  min="0"
                  className="goal-number-input"
                />
                <span className="unit">g</span>
              </div>
            </div>
            
            <div className="goal-form-group">
              <label htmlFor="fatGoal">
                Fat Goal
                <div className="slider-value">{goals.fatGoal} g</div>
              </label>
              <input
                type="range"
                name="fatGoal"
                id="fatGoal"
                min="20"
                max="200"
                step="5"
                value={goals.fatGoal}
                onChange={handleChange}
                className="goal-slider"
              />
              <div className="goal-input-group">
                <input
                  type="number"
                  name="fatGoal"
                  value={goals.fatGoal}
                  onChange={handleChange}
                  min="0"
                  className="goal-number-input"
                />
                <span className="unit">g</span>
              </div>
            </div>
          </div>
          
          <div className="goal-form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Goals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSettings;
