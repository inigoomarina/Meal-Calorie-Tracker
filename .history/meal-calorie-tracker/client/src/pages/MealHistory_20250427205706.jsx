import { useState, useEffect, useContext, useCallback } from 'react';
import mealService from '../services/mealService';
import { AuthContext } from '../context/AuthContext.jsx';
import MealCalendar from '../components/MealCalendar'; // Import the calendar component
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
      const fetchedMeals = await mealService.getUserMeals({ startDate, endDate });
      setMeals(fetchedMeals || []);
    } catch (err) {
      console.error('Failed to fetch meal history:', err);
      setError('Failed to load meal history. Please try again.');
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

      <div className="filters-container">
        <div className="date-filters">
          <div className="form-group">
            <label htmlFor="startDate">Start Date:</label>
            <input 
              type="date" 
              id="startDate" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date:</label>
            <input 
              type="date" 
              id="endDate" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          {/* Button to trigger fetch manually if needed, though useEffect handles it */}
          {/* <button onClick={fetchMeals} disabled={isLoading}>Load History</button> */}
        </div>
        {/* Add sorting/view controls here if needed */}
      </div>

      {isLoading && <div className="loading">Loading meal history...</div>}
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && (
        // Use MealCalendar to display the fetched meals grouped by day
        <MealCalendar meals={meals} onDeleteMeal={handleDeleteMeal} />
      )}
    </div>
  );
};

export default MealHistory;