import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';
import './MealHistory.css';

const MacroDetailModal = ({ open, onClose, day }) => {
  if (!open || !day) return null;
  return (
    <div className="meal-modal-overlay" onClick={onClose}>
      <div className="meal-modal-content" onClick={e => e.stopPropagation()}>
        <h2>{new Date(day.date).toLocaleDateString('en-US', {weekday: 'long', month: 'short', day: 'numeric'})}</h2>
        <div><strong>Total Calories:</strong> {Math.round(day.calories)} cal</div>
        <div style={{margin: '1rem 0'}}>
          <strong>Macros:</strong>
          <div>Protein: {day.protein.toFixed(1)}g</div>
          <div>Carbs: {day.carbs.toFixed(1)}g</div>
          <div>Fat: {day.fat.toFixed(1)}g</div>
          <div>Fiber: {day.fiber.toFixed(1)}g</div>
          <div>Sugar: {day.sugar.toFixed(1)}g</div>
        </div>
        <div>
          <strong>Meals:</strong>
          <ul>
            {day.meals.map(meal => (
              <li key={meal._id}>
                <span>{meal.name}</span> &mdash; {meal.calories} cal
              </li>
            ))}
          </ul>
        </div>
        <button className="btn-save" style={{marginTop:'1.5rem'}} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const MealHistory = () => {
  const { user } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    loadMealHistory();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  const loadMealHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mealService.getUserMeals({
        startDate,
        endDate
      });
      setMeals(Array.isArray(response) ? response : []);
    } catch (err) {
      setError("Could not load your meal history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Group meals by day and calculate totals
  const groupByDay = () => {
    const dayMap = {};
    meals.forEach(meal => {
      const dateStr = new Date(meal.time || meal.date || meal.createdAt).toISOString().split('T')[0];
      if (!dayMap[dateStr]) {
        dayMap[dateStr] = {
          date: dateStr,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          meals: []
        };
      }
      dayMap[dateStr].calories += meal.calories || 0;
      dayMap[dateStr].protein += parseFloat(meal.protein || meal.nutrition?.protein || 0);
      dayMap[dateStr].carbs += parseFloat(meal.carbs || meal.nutrition?.carbs || 0);
      dayMap[dateStr].fat += parseFloat(meal.fat || meal.nutrition?.fat || 0);
      dayMap[dateStr].fiber += parseFloat(meal.fiber || meal.nutrition?.fiber || 0);
      dayMap[dateStr].sugar += parseFloat(meal.sugar || meal.nutrition?.sugar || 0);
      dayMap[dateStr].meals.push(meal);
    });
    return Object.values(dayMap).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const days = groupByDay();
  const calorieGoal = user?.calorieGoal || 2000;

  return (
    <div className="meal-history">
      <h1>Meal History</h1>
      <div className="filters-container">
        <div className="date-filters">
          <div className="form-group">
            <label htmlFor="startDate">From:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              max={endDate}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">To:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="meal-history-grid">
          {days.length === 0 ? (
            <div className="no-meals-message">No meals found for this period.</div>
          ) : (
            days.map(day => {
              const over = day.calories > calorieGoal;
              return (
                <div className={`meal-history-card ${over ? 'over-limit' : 'under-limit'}`} key={day.date}>
                  <div className="meal-history-date">
                    {new Date(day.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
                  </div>
                  <div className="meal-history-calories">
                    <strong>{Math.round(day.calories)}</strong> calories
                  </div>
                  <div className="meal-history-status">
                    {over ? (
                      <span className="over">Over goal by {Math.round(day.calories - calorieGoal)} cal</span>
                    ) : (
                      <span className="under">Under goal by {Math.round(calorieGoal - day.calories)} cal</span>
                    )}
                  </div>
                  <button className="btn-save" onClick={() => setSelectedDay(day)} style={{marginTop:'1rem'}}>View Details</button>
                </div>
              );
            })
          )}
        </div>
      )}
      <MacroDetailModal open={!!selectedDay} onClose={() => setSelectedDay(null)} day={selectedDay} />
    </div>
  );
};

export default MealHistory;