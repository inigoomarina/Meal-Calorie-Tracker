import { useState, useEffect, useContext, useCallback } from 'react';
import mealService from '../services/mealService';
import { AuthContext } from '../context/AuthContext.jsx';
import MealCalendar from '../components/MealCalendar';
import './MealHistory.css';

const MealHistory = () => {
  const { user } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Default date range to the last 7 days
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  const [startDate, setStartDate] = useState(oneWeekAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const fetchMeals = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log(`Fetching meals from ${startDate} to ${endDate}`);
      // Ensure dates are valid before fetching
      if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
         throw new Error("Invalid date range selected.");
      }
      const fetchedMeals = await mealService.getUserMeals({ startDate, endDate });
      setMeals(fetchedMeals || []);
    } catch (err) {
      console.error('Failed to fetch meal history:', err);
      setError(`Failed to load meal history: ${err.message}. Please try again.`);
      setMeals([]); // Clear meals on error
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]); // Fetch meals when dates change

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm("Are you sure you want to delete this meal?")) {
      return;
    }
    try {
      await mealService.deleteMeal(mealId);
      // Refetch meals after deletion
      fetchMeals(); 
    } catch (err) {
      console.error('Failed to delete meal:', err);
      setError('Failed to delete meal. Please try again.');
    }
  };

  return (
    <div className="meal-history">
      <h1>Meal History</h1>

      {/* Use history-filters class for consistency */}
      <div className="history-filters"> 
        {/* Use date-range and date-input classes */}
        <div className="date-range"> 
          <div className="date-input">
            <label htmlFor="startDate">Start Date:</label>
            <input 
              type="date" 
              id="startDate" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              max={endDate} // Prevent start date being after end date
            />
          </div>
          <div className="date-input">
            <label htmlFor="endDate">End Date:</label>
            <input 
              type="date" 
              id="endDate" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              min={startDate} // Prevent end date being before start date
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
            />
          </div>
          {/* Optional: Add a button to manually trigger fetch if needed */}
          {/* <button onClick={fetchMeals} disabled={isLoading} className="btn btn-secondary">Load</button> */}
        </div>
      </div>

      {isLoading && <div className="loading-container">Loading meal history...</div>}
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && meals.length > 0 && (
        // Use MealCalendar to display the fetched meals grouped by day
        <MealCalendar meals={meals} onDeleteMeal={handleDeleteMeal} />
      )}

      {/* Message when no meals are found after loading */}
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