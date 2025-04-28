import { useState, useEffect } from 'react';

// Assume CSS is handled in Dashboard.css or a global file
// import './GoalSettings.css'; 

const GoalSettings = ({ isOpen, onClose, onSave, initialGoals }) => {
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [proteinGoal, setProteinGoal] = useState(100);
  const [carbsGoal, setCarbsGoal] = useState(150);
  const [fatGoal, setFatGoal] = useState(70);
  const [isSaving, setIsSaving] = useState(false);

  // Update state when initialGoals change (e.g., when modal opens with new user data)
  useEffect(() => {
    if (initialGoals) {
      setCalorieGoal(initialGoals.calorieGoal || 2000);
      setProteinGoal(initialGoals.proteinGoal || 100);
      setCarbsGoal(initialGoals.carbsGoal || 150);
      setFatGoal(initialGoals.fatGoal || 70);
    }
  }, [initialGoals, isOpen]); // Rerun when modal opens or initial goals change

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ 
        calorieGoal: parseInt(calorieGoal, 10), 
        proteinGoal: parseInt(proteinGoal, 10), 
        carbsGoal: parseInt(carbsGoal, 10), 
        fatGoal: parseInt(fatGoal, 10) 
      });
      // onClose(); // Let the parent component handle closing on success
    } catch (error) {
      console.error("Error saving goals:", error);
      // Optionally show an error message within the modal
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="goal-settings-modal-overlay" onClick={onClose}>
      <div className="goal-settings-modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>Set Your Daily Goals</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="calorieGoal">Calories (kcal)</label>
            <input
              type="number"
              id="calorieGoal"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value)}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="proteinGoal">Protein (g)</label>
            <input
              type="number"
              id="proteinGoal"
              value={proteinGoal}
              onChange={(e) => setProteinGoal(e.target.value)}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="carbsGoal">Carbohydrates (g)</label>
            <input
              type="number"
              id="carbsGoal"
              value={carbsGoal}
              onChange={(e) => setCarbsGoal(e.target.value)}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="fatGoal">Fat (g)</label>
            <input
              type="number"
              id="fatGoal"
              value={fatGoal}
              onChange={(e) => setFatGoal(e.target.value)}
              min="0"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Goals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSettings;
