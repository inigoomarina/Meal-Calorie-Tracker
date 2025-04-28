import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import userService from '../services/userService';

const GoalSettings = ({ isOpen, onClose, onSave }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [proteinGoal, setProteinGoal] = useState(100);
  const [carbsGoal, setCarbsGoal] = useState(150);
  const [fatGoal, setFatGoal] = useState(70);
  const [fitnessGoal, setFitnessGoal] = useState('maintain');
  const [weight, setWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load current user settings when component mounts
  useEffect(() => {
    if (user) {
      setCalorieGoal(user.calorieGoal || 2000);
      setProteinGoal(user.proteinGoal || 100);
      setCarbsGoal(user.carbsGoal || 150);
      setFatGoal(user.fatGoal || 70);
      setFitnessGoal(user.fitnessGoal || 'maintain');
      setWeight(user.weight || '');
    }
  }, [user]);

  // Handle automatic adjustment of macros based on fitness goal
  const handleFitnessGoalChange = (e) => {
    const newGoal = e.target.value;
    setFitnessGoal(newGoal);
    
    // Default calorie needs (this could be more sophisticated with weight calculation)
    let newCalories = calorieGoal;
    
    // Adjust calories based on goal if weight is available
    if (weight && !isNaN(parseFloat(weight))) {
      const weightInKg = parseFloat(weight);
      // Base calorie calculation (basic BMR approximation)
      const baseCals = weightInKg * 22 * 1.2; // 22 cal per kg for moderate activity
      
      switch(newGoal) {
        case 'gain':
          newCalories = Math.round(baseCals * 1.15); // Surplus for muscle gain
          break;
        case 'maintain':
          newCalories = Math.round(baseCals);
          break;
        case 'lose':
          newCalories = Math.round(baseCals * 0.85); // Deficit for fat loss
          break;
        default:
          newCalories = Math.round(baseCals);
      }
    }
    
    // Set new calorie goal
    setCalorieGoal(newCalories);
    
    // Adjust macro ratio based on goal
    let proteinRatio, carbsRatio, fatRatio;
    
    switch(newGoal) {
      case 'gain':
        // Higher protein and carbs for muscle gain
        proteinRatio = 0.3;  // 30% of calories from protein
        carbsRatio = 0.5;    // 50% of calories from carbs
        fatRatio = 0.2;      // 20% of calories from fat
        break;
      case 'maintain':
        // Balanced macros for maintaining
        proteinRatio = 0.3;  // 30% of calories from protein
        carbsRatio = 0.4;    // 40% of calories from carbs
        fatRatio = 0.3;      // 30% of calories from fat
        break;
      case 'lose':
        // Higher protein, moderate fat, lower carbs for fat loss
        proteinRatio = 0.35; // 35% of calories from protein
        carbsRatio = 0.3;    // 30% of calories from carbs
        fatRatio = 0.35;     // 35% of calories from fat
        break;
      default:
        // Default to balanced
        proteinRatio = 0.3;
        carbsRatio = 0.4;
        fatRatio = 0.3;
    }
    
    // Calculate macro grams: calories ÷ calories per gram × ratio
    const newProtein = Math.round((newCalories * proteinRatio) / 4); // Protein: 4 cal/g
    const newCarbs = Math.round((newCalories * carbsRatio) / 4);     // Carbs: 4 cal/g
    const newFat = Math.round((newCalories * fatRatio) / 9);         // Fat: 9 cal/g
    
    setProteinGoal(newProtein);
    setCarbsGoal(newCarbs);
    setFatGoal(newFat);
  };

  // Handle updating weight and recalculating calories if needed
  const handleWeightChange = (e) => {
    setWeight(e.target.value);
  };

  // Handle saving the user's goals
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    try {
      // Prepare the user data with updated goals
      const userData = {
        calorieGoal,
        proteinGoal,
        carbsGoal,
        fatGoal,
        fitnessGoal,
        weight: weight || undefined
      };
      
      // Save to server
      await userService.updateUserSettings(userData);
      
      // Update local user context
      updateUser({
        ...user,
        ...userData
      });
      
      setSuccessMessage('Goals updated successfully!');
      
      // Notify parent component that settings were saved
      if (onSave) onSave(userData);
      
      // Close the settings panel after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Failed to save goals:', err);
      setError('Failed to save your goals. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If the modal is closed, don't render anything
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content goal-settings-modal">
        <div className="modal-header">
          <h2>Set Nutrition Goals</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSave}>
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            
            <div className="form-group">
              <label htmlFor="weight">Your Weight (kg)</label>
              <input
                type="number"
                id="weight"
                value={weight}
                onChange={handleWeightChange}
                placeholder="Enter your weight in kg"
                min="30"
                max="300"
                step="0.1"
              />
              <small className="form-text">Helps calculate appropriate calorie targets</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="fitnessGoal">Fitness Goal</label>
              <select
                id="fitnessGoal"
                value={fitnessGoal}
                onChange={handleFitnessGoalChange}
                className="goal-select"
              >
                <option value="gain">Gain Muscle</option>
                <option value="maintain">Keep Muscle & Lose Fat</option>
                <option value="lose">Lose Total Weight</option>
              </select>
            </div>
            
            <div className="macro-settings">
              <h3>Nutrition Targets</h3>
              
              <div className="form-group">
                <label htmlFor="calorieGoal">Daily Calories</label>
                <input
                  type="number"
                  id="calorieGoal"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 0)}
                  min="1200"
                  max="5000"
                  required
                />
                <span className="unit">cal</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="proteinGoal">Protein</label>
                <input
                  type="number"
                  id="proteinGoal"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(parseInt(e.target.value) || 0)}
                  min="50"
                  max="300"
                  required
                />
                <span className="unit">g</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="carbsGoal">Carbs</label>
                <input
                  type="number"
                  id="carbsGoal"
                  value={carbsGoal}
                  onChange={(e) => setCarbsGoal(parseInt(e.target.value) || 0)}
                  min="50"
                  max="500"
                  required
                />
                <span className="unit">g</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="fatGoal">Fat</label>
                <input
                  type="number"
                  id="fatGoal"
                  value={fatGoal}
                  onChange={(e) => setFatGoal(parseInt(e.target.value) || 0)}
                  min="20"
                  max="200"
                  required
                />
                <span className="unit">g</span>
              </div>
            </div>
            
            <div className="nutrition-summary">
              <p>
                <strong>Daily targets:</strong> {calorieGoal} calories, {proteinGoal}g protein, {carbsGoal}g carbs, {fatGoal}g fat
              </p>
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
    </div>
  );
};

export default GoalSettings;
