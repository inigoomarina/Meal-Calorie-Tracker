import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import './GoalSettings.css';

const GoalSettings = ({ isOpen, onClose, onSave, initialGoals }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [calorieGoal, setCalorieGoal] = useState(user?.calorieGoal || 2000);
  const [proteinGoal, setProteinGoal] = useState(user?.proteinGoal || 100);
  const [carbsGoal, setCarbsGoal] = useState(user?.carbsGoal || 150);
  const [fatGoal, setFatGoal] = useState(user?.fatGoal || 70);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with user data when modal opens
  useEffect(() => {
    if (isOpen) {
      setCalorieGoal(user?.calorieGoal || 2000);
      setProteinGoal(user?.proteinGoal || 100);
      setCarbsGoal(user?.carbsGoal || 150);
      setFatGoal(user?.fatGoal || 70);
      setError('');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Update user profile with new goals
      const updatedUser = await updateUser({
        calorieGoal,
        proteinGoal, 
        carbsGoal,
        fatGoal
      });
      
      // Notify parent component of saved goals
      onSave({
        calorieGoal,
        proteinGoal,
        carbsGoal,
        fatGoal
      });
      
      onClose();
    } catch (err) {
      console.error("Failed to save goals:", err);
      setError("Couldn't save your goals. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="goal-settings-overlay" onClick={onClose}>
      <div className="goal-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="goal-settings-header">
          <h2>Set Nutrition Goals</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="calorieGoal">
              Daily Calorie Goal
              <div className="goal-info">Recommended: 1800-2500 calories per day</div>
            </label>
            <input
              type="number"
              id="calorieGoal"
              value={calorieGoal}
              onChange={e => setCalorieGoal(parseInt(e.target.value) || 0)}
              min="500"
              max="10000"
              required
            />
          </div>
          
          <div className="macros-group">
            <h3>Macronutrient Goals</h3>
            <div className="form-group">
              <label htmlFor="proteinGoal">
                Protein (g)
                <div className="goal-info">Recommended: 0.8-1.2g per lb of body weight</div>
              </label>
              <input
                type="number"
                id="proteinGoal"
                value={proteinGoal}
                onChange={e => setProteinGoal(parseInt(e.target.value) || 0)}
                min="10"
                max="500"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="carbsGoal">
                Carbohydrates (g)
                <div className="goal-info">Recommended: 45-65% of total calories</div>
              </label>
              <input
                type="number"
                id="carbsGoal"
                value={carbsGoal}
                onChange={e => setCarbsGoal(parseInt(e.target.value) || 0)}
                min="20"
                max="800"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="fatGoal">
                Fat (g)
                <div className="goal-info">Recommended: 20-35% of total calories</div>
              </label>
              <input
                type="number"
                id="fatGoal"
                value={fatGoal}
                onChange={e => setFatGoal(parseInt(e.target.value) || 0)}
                min="10"
                max="300"
                required
              />
            </div>
          </div>
          
          <div className="goal-settings-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
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
