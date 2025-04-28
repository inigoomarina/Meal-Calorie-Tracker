import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import authService from '../services/authService';

const GoalSettings = ({ isOpen, onClose, onSave }) => {
  const { user, fetchUser } = useContext(AuthContext); // Use fetchUser to update context
  const [goals, setGoals] = useState({
    calorieGoal: 2000,
    proteinGoal: 100,
    carbsGoal: 150,
    fatGoal: 70,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setGoals({
        calorieGoal: user.calorieGoal || 2000,
        proteinGoal: user.proteinGoal || 100,
        carbsGoal: user.carbsGoal || 150,
        fatGoal: user.fatGoal || 70,
      });
    }
  }, [user, isOpen]); // Reload goals when modal opens or user data changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Ensure values are numbers and non-negative
    const numericValue = Math.max(0, parseInt(value, 10) || 0);
    setGoals(prev => ({ ...prev, [name]: numericValue }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Call the updateProfile method which should handle goal updates
      await authService.updateProfile(goals); 
      setSuccess('Goals updated successfully!');
      
      // Refetch user data to update context globally
      await fetchUser(); 
      
      // Call the onSave callback passed from Dashboard
      if (onSave) {
        onSave(goals);
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess(''); // Clear success message on close
      }, 1500); 
      
    } catch (err) {
      console.error('Error saving goals:', err);
      setError(err.response?.data?.message || 'Failed to save goals.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay goal-settings-overlay"> {/* Added specific class */}
      <div className="modal-content goal-settings-content"> {/* Added specific class */}
        <div className="modal-header">
          <h2>Set Your Daily Goals</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <form onSubmit={handleSave} className="modal-body">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="form-group">
            <label htmlFor="calorieGoal">Daily Calorie Goal (kcal)</label>
            <input
              type="number"
              id="calorieGoal"
              name="calorieGoal"
              value={goals.calorieGoal}
              onChange={handleChange}
              min="0"
              step="50"
              required
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
              min="0"
              step="5"
              required
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
              min="0"
              step="5"
              required
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
              min="0"
              step="5"
              required
            />
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Goals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSettings;
