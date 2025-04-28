import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import Modal from './Modal'; // Import the new Modal component
import './GoalSettings.css';

const GoalSettings = ({ isOpen, onClose, onSave }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [goals, setGoals] = useState({
    calorieGoal: '',
    proteinGoal: '',
    carbsGoal: '',
    fatGoal: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize form with user's current goals when modal opens or user data changes
    if (user && isOpen) {
      setGoals({
        calorieGoal: user.calorieGoal || '',
        proteinGoal: user.proteinGoal || '',
        carbsGoal: user.carbsGoal || '',
        fatGoal: user.fatGoal || ''
      });
      setError(''); // Clear previous errors when opening
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Allow only numbers and ensure non-negative values
    if (/^\d*$/.test(value)) {
      setGoals(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Convert goals to numbers, providing defaults if empty
    const numericGoals = {
      calorieGoal: Number(goals.calorieGoal) || 2000,
      proteinGoal: Number(goals.proteinGoal) || 100,
      carbsGoal: Number(goals.carbsGoal) || 150,
      fatGoal: Number(goals.fatGoal) || 70
    };

    try {
      await updateUser(numericGoals); // Use context's updateUser function
      onSave(numericGoals); // Call the onSave prop passed from Dashboard
      onClose(); // Close modal on success
    } catch (err) {
      console.error('Failed to save goals:', err);
      setError(`Failed to save goals: ${err.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Use the Modal component to wrap the form
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Your Daily Goals">
      <form onSubmit={handleSubmit} className="goal-settings-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="calorieGoal">Daily Calorie Goal (kcal)</label>
          <input
            type="number"
            id="calorieGoal"
            name="calorieGoal"
            value={goals.calorieGoal}
            onChange={handleChange}
            placeholder="e.g., 2000"
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="proteinGoal">Daily Protein Goal (g)</label>
          <input
            type="number"
            id="proteinGoal"
            name="proteinGoal"
            value={goals.proteinGoal}
            onChange={handleChange}
            placeholder="e.g., 100"
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="carbsGoal">Daily Carbs Goal (g)</label>
          <input
            type="number"
            id="carbsGoal"
            name="carbsGoal"
            value={goals.carbsGoal}
            onChange={handleChange}
            placeholder="e.g., 150"
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="fatGoal">Daily Fat Goal (g)</label>
          <input
            type="number"
            id="fatGoal"
            name="fatGoal"
            value={goals.fatGoal}
            onChange={handleChange}
            placeholder="e.g., 70"
            min="0"
          />
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Goals'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GoalSettings;
