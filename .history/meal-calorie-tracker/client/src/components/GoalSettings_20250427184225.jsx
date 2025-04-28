import { useState, useEffect } from 'react';
import './GoalSettings.css';

const GoalSettings = ({ isOpen, onClose, onSave }) => {
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [proteinGoal, setProteinGoal] = useState(100);
  const [carbsGoal, setCarbsGoal] = useState(150);
  const [fatGoal, setFatGoal] = useState(70);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Optionally fetch user's current goals here if needed
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        calorieGoal: parseInt(calorieGoal, 10),
        proteinGoal: parseInt(proteinGoal, 10),
        carbsGoal: parseInt(carbsGoal, 10),
        fatGoal: parseInt(fatGoal, 10)
      });
      onClose();
    } catch (err) {
      // Optionally show error
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="goal-modal-overlay" onClick={onClose}>
      <div className="goal-modal-content" onClick={e => e.stopPropagation()}>
        <h2>Set Your Daily Goals</h2>
        <form onSubmit={handleSubmit}>
          <div className="goal-form-group">
            <label>Calories</label>
            <input type="number" min="500" max="10000" value={calorieGoal} onChange={e => setCalorieGoal(e.target.value)} required />
          </div>
          <div className="goal-form-group">
            <label>Protein (g)</label>
            <input type="number" min="10" max="500" value={proteinGoal} onChange={e => setProteinGoal(e.target.value)} required />
          </div>
          <div className="goal-form-group">
            <label>Carbs (g)</label>
            <input type="number" min="10" max="1000" value={carbsGoal} onChange={e => setCarbsGoal(e.target.value)} required />
          </div>
          <div className="goal-form-group">
            <label>Fat (g)</label>
            <input type="number" min="10" max="300" value={fatGoal} onChange={e => setFatGoal(e.target.value)} required />
          </div>
          <div className="goal-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSettings;
