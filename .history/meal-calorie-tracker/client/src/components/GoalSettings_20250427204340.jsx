import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './GoalSettings.css';

const GoalSettings = ({ isOpen, onClose, onSave }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [proteinGoal, setProteinGoal] = useState(100);
  const [carbsGoal, setCarbsGoal] = useState(150);
  const [fatGoal, setFatGoal] = useState(70);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with user's current goals when the component mounts
  useEffect(() => {
    if (user) {
      setCalorieGoal(user.calorieGoal || 2000);
      setProteinGoal(user.proteinGoal || 100);
      setCarbsGoal(user.carbsGoal || 150);
      setFatGoal(user.fatGoal || 70);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Validate inputs
    if (calorieGoal <= 0 || proteinGoal <= 0 || carbsGoal <= 0 || fatGoal <= 0) {
      setError('All goals must be positive values.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Update user profile with new goals
      await updateUser({
        calorieGoal,
        proteinGoal, 
        carbsGoal,
        fatGoal
      });
      
      // Call onSave callback with the new goals
      if (onSave) {
        onSave({
          calorieGoal,
          proteinGoal,
          carbsGoal,
          fatGoal
        });
      }
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Failed to update goals:', err);
      setError('Failed to save your goals. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content goal-settings-modal">
        <div className="modal-header">
          <h2>Set Daily Goals</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="calorieGoal">Daily Calorie Goal</label>
            <input
              id="calorieGoal"
              type="number"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(parseInt(e.target.value))}
              min="500"
              max="10000"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="proteinGoal">Daily Protein Goal (g)</label>
            <input
              id="proteinGoal"
              type="number"
              value={proteinGoal}
              onChange={(e) => setProteinGoal(parseInt(e.target.value))}
              min="10"
              max="500"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="carbsGoal">Daily Carbs Goal (g)</label>
            <input
              id="carbsGoal"
              type="number"
              value={carbsGoal}
              onChange={(e) => setCarbsGoal(parseInt(e.target.value))}
              min="10"
              max="1000"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="fatGoal">Daily Fat Goal (g)</label>
            <input
              id="fatGoal"
              type="number"
              value={fatGoal}
              onChange={(e) => setFatGoal(parseInt(e.target.value))}
              min="10"
              max="500"
              required
            />
          </div>
          
          <div className="modal-actions">
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
