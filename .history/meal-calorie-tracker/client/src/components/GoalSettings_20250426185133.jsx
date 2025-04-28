import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import Modal from './Modal';
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

  // Load current goals from user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setGoals({
        calorieGoal: user.calorieGoal || 2000,
        proteinGoal: user.proteinGoal || 100,
        carbsGoal: user.carbsGoal || 150,
        fatGoal: user.fatGoal || 70
      });
    }
  }, [isOpen, user]);

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
    
    try {
      // Update user profile through AuthContext
      await updateUser(goals);
      
      // Call the onSave callback from parent component
      if (onSave) {
        onSave(goals);
      }
      
      onClose();
    } catch (err) {
      console.error("Failed to save goals:", err);
      setError("Failed to save your goals. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Nutrition Goals"
      maxWidth="600px"
    >
      <div className="goals-container">
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="goal-form-grid">
            <div className="goal-form-group">
              <label htmlFor="calorieGoal">
                Daily Calories
                <div className="slider-value">{goals.calorieGoal} cal</div>
              </label>
              <div className="slider-container">
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
              </div>
              <div className="input-with-unit">
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
              <div className="slider-container">
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
              </div>
              <div className="input-with-unit">
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
              <div className="slider-container">
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
              </div>
              <div className="input-with-unit">
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
              <div className="slider-container">
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
              </div>
              <div className="input-with-unit">
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
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Goals'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default GoalSettings;
