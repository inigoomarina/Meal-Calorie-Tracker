import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const GoalSettings = ({ isOpen, onClose, onSave }) => {
  const { user, updateUser } = useContext(AuthContext);
  
  const [calorieGoal, setCalorieGoal] = useState(user?.calorieGoal || 2000);
  const [goalType, setGoalType] = useState(user?.goalType || 'maintain');
  const [proteinGoal, setProteinGoal] = useState(user?.proteinGoal || 100);
  const [carbsGoal, setCarbsGoal] = useState(user?.carbsGoal || 150);
  const [fatGoal, setFatGoal] = useState(user?.fatGoal || 70);
  
  // When goal type changes, suggest appropriate macro ratios
  useEffect(() => {
    if (!calorieGoal) return;
    
    // Calculate macros based on goal type
    let protein, carbs, fat;
    
    switch(goalType) {
      case 'gain':
        // Higher carbs and moderate protein for muscle gain
        protein = Math.round(calorieGoal * 0.3 / 4); // 30% protein (4 cal/g)
        fat = Math.round(calorieGoal * 0.25 / 9); // 25% fat (9 cal/g)
        carbs = Math.round(calorieGoal * 0.45 / 4); // 45% carbs (4 cal/g)
        break;
      case 'lose':
        // Higher protein, lower carbs for weight loss
        protein = Math.round(calorieGoal * 0.4 / 4); // 40% protein
        fat = Math.round(calorieGoal * 0.3 / 9); // 30% fat
        carbs = Math.round(calorieGoal * 0.3 / 4); // 30% carbs
        break;
      case 'maintain':
      default:
        // Balanced macros for maintenance
        protein = Math.round(calorieGoal * 0.35 / 4); // 35% protein
        fat = Math.round(calorieGoal * 0.3 / 9); // 30% fat
        carbs = Math.round(calorieGoal * 0.35 / 4); // 35% carbs
    }
    
    setProteinGoal(protein);
    setCarbsGoal(carbs);
    setFatGoal(fat);
  }, [goalType, calorieGoal]);
  
  const handleSave = () => {
    // Update user data with new goals
    const updatedUserData = {
      calorieGoal,
      goalType,
      proteinGoal,
      carbsGoal,
      fatGoal
    };
    
    // Update local user state and send to backend
    updateUser(updatedUserData);
    
    // Also call the onSave callback to update Dashboard state
    onSave(updatedUserData);
    
    // Close the modal
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Set Your Goals</h2>
        
        <div className="form-group">
          <label htmlFor="calorieGoal">Daily Calorie Goal</label>
          <input
            type="number"
            id="calorieGoal"
            min="1200"
            max="6000"
            value={calorieGoal}
            onChange={e => setCalorieGoal(parseInt(e.target.value) || 2000)}
          />
        </div>
        
        <div className="form-group">
          <label>Goal Type</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="goalType"
                value="gain"
                checked={goalType === 'gain'}
                onChange={() => setGoalType('gain')}
              />
              Gain Muscle
            </label>
            <label>
              <input
                type="radio"
                name="goalType"
                value="maintain"
                checked={goalType === 'maintain'}
                onChange={() => setGoalType('maintain')}
              />
              Maintain (Keep muscle & lose fat)
            </label>
            <label>
              <input
                type="radio"
                name="goalType"
                value="lose"
                checked={goalType === 'lose'}
                onChange={() => setGoalType('lose')}
              />
              Lose Weight
            </label>
          </div>
        </div>
        
        <div className="macro-goals">
          <h3>Recommended Macro Targets</h3>
          <div className="macro-inputs">
            <div className="form-group">
              <label htmlFor="proteinGoal">Protein (g)</label>
              <input
                type="number"
                id="proteinGoal"
                min="10"
                max="500"
                value={proteinGoal}
                onChange={e => setProteinGoal(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="carbsGoal">Carbs (g)</label>
              <input
                type="number"
                id="carbsGoal"
                min="10"
                max="500"
                value={carbsGoal}
                onChange={e => setCarbsGoal(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="fatGoal">Fat (g)</label>
              <input
                type="number"
                id="fatGoal"
                min="10"
                max="500"
                value={fatGoal}
                onChange={e => setFatGoal(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Goals</button>
        </div>
      </div>
    </div>
  );
};

export default GoalSettings;
