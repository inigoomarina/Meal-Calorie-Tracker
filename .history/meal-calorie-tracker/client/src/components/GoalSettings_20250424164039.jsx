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
    activityLevel: 'moderate',
    weightGoal: 'maintain'
  });

  useEffect(() => {
    // Update form with user data if available
    if (user) {
      setFormData({
        calorieGoal: user.calorieGoal || 2000,
        carbsGoal: user.carbsGoal || 150,
        proteinGoal: user.proteinGoal || 100,
        fatGoal: user.fatGoal || 70,
        activityLevel: user.activityLevel || 'moderate',
        weightGoal: user.weightGoal || 'maintain'
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Save to user profile via context
      await updateUser(formData);
      
      // Pass data to parent component
      if (onSave) {
        onSave(formData);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Set Nutrition Goals</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="calorieGoal">Daily Calorie Goal:</label>
            <input
              type="number"
              id="calorieGoal"
              name="calorieGoal"
              value={formData.calorieGoal}
              onChange={handleChange}
              min="1000"
              max="5000"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="weightGoal">Weight Goal:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="weightGoal"
                  value="lose"
                  checked={formData.weightGoal === 'lose'}
                  onChange={handleChange}
                />
                Lose Weight
              </label>
              <label>
                <input
                  type="radio"
                  name="weightGoal"
                  value="maintain"
                  checked={formData.weightGoal === 'maintain'}
                  onChange={handleChange}
                />
                Maintain Weight
              </label>
              <label>
                <input
                  type="radio"
                  name="weightGoal"
                  value="gain"
                  checked={formData.weightGoal === 'gain'}
                  onChange={handleChange}
                />
                Gain Weight
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="activityLevel">Activity Level:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="activityLevel"
                  value="sedentary"
                  checked={formData.activityLevel === 'sedentary'}
                  onChange={handleChange}
                />
                Sedentary
              </label>
              <label>
                <input
                  type="radio"
                  name="activityLevel"
                  value="light"
                  checked={formData.activityLevel === 'light'}
                  onChange={handleChange}
                />
                Light Activity
              </label>
              <label>
                <input
                  type="radio"
                  name="activityLevel"
                  value="moderate"
                  checked={formData.activityLevel === 'moderate'}
                  onChange={handleChange}
                />
                Moderate Activity
              </label>
              <label>
                <input
                  type="radio"
                  name="activityLevel"
                  value="active"
                  checked={formData.activityLevel === 'active'}
                  onChange={handleChange}
                />
                Very Active
              </label>
            </div>
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Goals</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSettings;
