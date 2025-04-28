import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import './GoalSettings.css';

const GoalSettings = ({ isOpen, onClose, onSave }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    calorieGoal: 2000,
    carbsGoal: 150,
    proteinGoal: 100,
    fatGoal: 70,
    goalType: 'maintenance'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize form data with user's current values if available
    if (user) {
      setFormData({
        calorieGoal: user.calorieGoal || 2000,
        carbsGoal: user.carbsGoal || 150,
        proteinGoal: user.proteinGoal || 100,
        fatGoal: user.fatGoal || 70,
        goalType: user.goalType || 'maintenance'
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Parse numeric inputs
    if (['calorieGoal', 'carbsGoal', 'proteinGoal', 'fatGoal'].includes(name)) {
      parsedValue = parseInt(value) || 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validate form
      if (formData.calorieGoal <= 0) {
        throw new Error("Calorie goal must be greater than 0");
      }
      
      // Update user profile with new goals
      await updateUser({
        calorieGoal: formData.calorieGoal,
        carbsGoal: formData.carbsGoal,
        proteinGoal: formData.proteinGoal,
        fatGoal: formData.fatGoal,
        goalType: formData.goalType
      });
      
      // Call onSave with the new goals
      onSave(formData);
      
      // Close modal
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update goals");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Set Nutritional Goals</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="goalType">Goal Type:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="goalType"
                  value="weight-loss"
                  checked={formData.goalType === 'weight-loss'}
                  onChange={handleChange}
                />
                Weight Loss
              </label>
              <label>
                <input
                  type="radio"
                  name="goalType"
                  value="maintenance"
                  checked={formData.goalType === 'maintenance'}
                  onChange={handleChange}
                />
                Maintenance
              </label>
              <label>
                <input
                  type="radio"
                  name="goalType"
                  value="muscle-gain"
                  checked={formData.goalType === 'muscle-gain'}
                  onChange={handleChange}
                />
                Muscle Gain
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="calorieGoal">Daily Calorie Goal:</label>
            <input
              type="number"
              id="calorieGoal"
              name="calorieGoal"
              value={formData.calorieGoal}
              onChange={handleChange}
              min="500"
              step="50"
              required
            />
          </div>
          
          <div className="macro-goals">
            <h3>Macro Nutrient Goals</h3>
            <div className="macro-inputs">
              <div className="form-group">
                <label htmlFor="carbsGoal">Carbs (g):</label>
                <input
                  type="number"
                  id="carbsGoal"
                  name="carbsGoal"
                  value={formData.carbsGoal}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="proteinGoal">Protein (g):</label>
                <input
                  type="number"
                  id="proteinGoal"
                  name="proteinGoal"
                  value={formData.proteinGoal}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="fatGoal">Fat (g):</label>
                <input
                  type="number"
                  id="fatGoal"
                  name="fatGoal"
                  value={formData.fatGoal}
                  onChange={handleChange}
                  min="0"
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
