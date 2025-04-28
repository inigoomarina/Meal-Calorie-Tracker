import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import './GoalSettings.css';

const GoalSettings = ({ isOpen, onClose, onSave }) => {
  const { user, updateUser } = useContext(AuthContext);
  
  const [goals, setGoals] = useState({
    calorieGoal: 2000,
    carbsGoal: 150,
    proteinGoal: 100,
    fatGoal: 70,
    dietType: 'balanced'
  });

  // When the user changes, update the form with their saved goals
  useEffect(() => {
    if (user) {
      setGoals({
        calorieGoal: user.calorieGoal || 2000,
        carbsGoal: user.carbsGoal || 150,
        proteinGoal: user.proteinGoal || 100,
        fatGoal: user.fatGoal || 70,
        dietType: user.dietType || 'balanced'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // For numeric inputs, convert to number
    if (['calorieGoal', 'carbsGoal', 'proteinGoal', 'fatGoal'].includes(name)) {
      setGoals(prev => ({
        ...prev,
        [name]: parseInt(value, 10) || 0
      }));
    } else {
      setGoals(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDietTypeChange = (dietType) => {
    let newGoals = { ...goals, dietType };
    
    // Update macro ratios based on diet type
    switch (dietType) {
      case 'keto':
        newGoals = {
          ...newGoals,
          carbsGoal: Math.round(goals.calorieGoal * 0.05 / 4), // 5% of calories from carbs
          proteinGoal: Math.round(goals.calorieGoal * 0.25 / 4), // 25% of calories from protein
          fatGoal: Math.round(goals.calorieGoal * 0.70 / 9), // 70% of calories from fat
        };
        break;
      case 'lowCarb':
        newGoals = {
          ...newGoals,
          carbsGoal: Math.round(goals.calorieGoal * 0.20 / 4), // 20% of calories from carbs
          proteinGoal: Math.round(goals.calorieGoal * 0.35 / 4), // 35% of calories from protein
          fatGoal: Math.round(goals.calorieGoal * 0.45 / 9), // 45% of calories from fat
        };
        break;
      case 'highProtein':
        newGoals = {
          ...newGoals,
          carbsGoal: Math.round(goals.calorieGoal * 0.40 / 4), // 40% of calories from carbs
          proteinGoal: Math.round(goals.calorieGoal * 0.40 / 4), // 40% of calories from protein
          fatGoal: Math.round(goals.calorieGoal * 0.20 / 9), // 20% of calories from fat
        };
        break;
      default: // balanced
        newGoals = {
          ...newGoals,
          carbsGoal: Math.round(goals.calorieGoal * 0.45 / 4), // 45% of calories from carbs
          proteinGoal: Math.round(goals.calorieGoal * 0.30 / 4), // 30% of calories from protein
          fatGoal: Math.round(goals.calorieGoal * 0.25 / 9), // 25% of calories from fat
        };
    }
    
    setGoals(newGoals);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Save the updated goals to the user profile
      await updateUser(goals);
      
      // Notify parent components
      if (onSave) {
        onSave(goals);
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Failed to save goals:', error);
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
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="calorieGoal">Daily Calorie Goal</label>
            <input
              type="number"
              id="calorieGoal"
              name="calorieGoal"
              value={goals.calorieGoal}
              onChange={handleChange}
              min="1000"
              max="5000"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Diet Type</label>
            <div className="radio-group">
              <label>
                <input 
                  type="radio" 
                  name="dietType" 
                  value="balanced" 
                  checked={goals.dietType === 'balanced'}
                  onChange={() => handleDietTypeChange('balanced')}
                />
                Balanced (45% carbs, 30% protein, 25% fat)
              </label>
              <label>
                <input 
                  type="radio" 
                  name="dietType" 
                  value="lowCarb" 
                  checked={goals.dietType === 'lowCarb'}
                  onChange={() => handleDietTypeChange('lowCarb')}
                />
                Low Carb (20% carbs, 35% protein, 45% fat)
              </label>
              <label>
                <input 
                  type="radio" 
                  name="dietType" 
                  value="keto" 
                  checked={goals.dietType === 'keto'}
                  onChange={() => handleDietTypeChange('keto')}
                />
                Keto (5% carbs, 25% protein, 70% fat)
              </label>
              <label>
                <input 
                  type="radio" 
                  name="dietType" 
                  value="highProtein" 
                  checked={goals.dietType === 'highProtein'}
                  onChange={() => handleDietTypeChange('highProtein')}
                />
                High Protein (40% carbs, 40% protein, 20% fat)
              </label>
            </div>
          </div>
          
          <div className="macro-goals">
            <h3>Macronutrient Goals</h3>
            <p>Fine-tune your macros below:</p>
            <div className="macro-inputs">
              <div className="form-group">
                <label htmlFor="carbsGoal">Carbs (g)</label>
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
              </div>
              <div className="form-group">
                <label htmlFor="proteinGoal">Protein (g)</label>
                <input
                  type="number"
                  id="proteinGoal"
                  name="proteinGoal"
                  value={goals.proteinGoal}
                  onChange={handleChange}
                  min="20"
                  max="500"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="fatGoal">Fat (g)</label>
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
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Goals
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSettings;
