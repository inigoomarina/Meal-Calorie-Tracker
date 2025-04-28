import { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import mealService from '@/services/mealService';
import { AuthContext } from '@/context/AuthContext.jsx';
import MealCalendar from '@/components/MealCalendar'; // Using MealCalendar for card display
import './MealHistory.css';

const MealHistory = () => {
  const { user } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Default date range to the last 7 days
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 6); // Start 6 days ago to include today (7 days total)

  const [startDate, setStartDate] = useState(oneWeekAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const fetchMeals = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log(`Fetching meals from ${startDate} to ${endDate}`);
      if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
         throw new Error("Invalid date range selected.");
      }
      // Pass dates to backend for filtering
      const fetchedMeals = await mealService.getUserMeals({ startDate, endDate });
      console.log("Fetched meals for history:", fetchedMeals);
      setMeals(fetchedMeals || []);
    } catch (err) {
      console.error('Failed to fetch meal history:', err);
      setError(`Failed to load meal history: ${err.message}. Please try again.`);
      setMeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm("Are you sure you want to delete this meal?")) {
      return;
    }
    try {
      await mealService.deleteMeal(mealId);
      fetchMeals(); // Refetch meals after deletion
    } catch (err) {
      console.error('Failed to delete meal:', err);
      setError('Failed to delete meal. Please try again.');
    }
  };

  return (
    <div className="meal-history">
      <h1>Meal History</h1>

      <div className="history-filters">
        <div className="date-range">
          <div className="date-input">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
            />
          </div>
          <div className="date-input">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          {/* Button to explicitly trigger fetch if needed, useful if date inputs don't auto-trigger */}
          {/* <button onClick={fetchMeals} disabled={isLoading} className="btn btn-secondary">Load History</button> */}
        </div>
      </div>

      {isLoading && <div className="loading-container">Loading meal history...</div>}
      {error && <div className="error-message">{error}</div>}

      {!isLoading && !error && meals.length > 0 && (
        // MealCalendar component renders the cards per day
        <MealCalendar meals={meals} onDeleteMeal={handleDeleteMeal} />
      )}

      {!isLoading && !error && meals.length === 0 && (
         <div className="no-data-message">
            <p>No meals found for the selected period.</p>
            <Link to="/log-meal" className="btn btn-primary">Log Your First Meal</Link>
         </div>
      )}
    </div>
  );
};

export default MealHistory;