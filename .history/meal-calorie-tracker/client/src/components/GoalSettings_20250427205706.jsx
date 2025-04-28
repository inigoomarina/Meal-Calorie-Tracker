import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import './GoalSettings.css'; // Import the CSS file

const GoalSettings = ({ isOpen, onClose, onSave, initialGoals }) => {
  const { user } = useContext(AuthContext);
  const [goals, setGoals] = useState({
    calorieGoal: 2000,
    proteinGoal: 100,
    carbsGoal: 150,
    fatGoal: 70,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize with user's current goals or passed initialGoals when modal opens or user changes
    const currentGoals = initialGoals || {
      calorieGoal: user?.calorieGoal || 2000,
      proteinGoal: user?.proteinGoal || 100,
      carbsGoal: user?.carbsGoal || 150,
      fatGoal: user?.fatGoal || 70,
    };
    setGoals(currentGoals);
  }, [isOpen, user, initialGoals]); // Re-initialize if user context changes while open

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Ensure only positive numbers are set
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setGoals(prevGoals => ({
        ...prevGoals,
        [name]: numericValue
      }));
    } else if (value === '') {
      // Allow clearing the input, handle potential NaN during save
       setGoals(prevGoals => ({
        ...prevGoals,
        [name]: '' // Store as empty string temporarily
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validate that all goals are numbers and positive
    const finalGoals = {
      calorieGoal: parseInt(goals.calorieGoal, 10),
      proteinGoal: parseInt(goals.proteinGoal, 10),
      carbsGoal: parseInt(goals.carbsGoal, 10),
      fatGoal: parseInt(goals.fatGoal, 10),
    };

    for (const key in finalGoals) {
      if (isNaN(finalGoals[key]) || finalGoals[key] < 0) {
        setError(`Please enter a valid positive number for ${key}.`);
        return;
      }
    }
    
    onSave(finalGoals);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="goal-settings-modal-overlay" onClick={onClose}>
      <div className="goal-settings-modal-content" onClick={e => e.stopPropagation()}>
        <h2>Set Your Daily Goals</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="calorieGoal">Calorie Goal (kcal)</label>
            <input
              type="number"
              id="calorieGoal"
              name="calorieGoal"
              value={goals.calorieGoal}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="proteinGoal">Protein Goal (g)</label>
            <input
              type="number"
              id="proteinGoal"
              name="proteinGoal"
              value={goals.proteinGoal}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="carbsGoal">Carbohydrate Goal (g)</label>
            <input
              type="number"
              id="carbsGoal"
              name="carbsGoal"
              value={goals.carbsGoal}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="fatGoal">Fat Goal (g)</label>
            <input
              type="number"
              id="fatGoal"
              name="fatGoal"
              value={goals.fatGoal}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Goals</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSettings;
