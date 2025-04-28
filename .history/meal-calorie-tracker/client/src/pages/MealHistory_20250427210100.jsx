import { useState, useEffect, useContext, useCallback } from 'react';
import mealService from '../services/mealService';
import { AuthContext } from '../context/AuthContext.jsx';
import MealCalendar from '../components/MealCalendar'; // Import the calendar component
import './MealHistory.css'; // Import CSS

const MealHistory = () => {
  const { user } = useContext(AuthContext); // Get user for goal context if needed in Calendar
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Default date range to the last 7 days
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 6); // Include today, so 6 days ago makes 7 days total

  const [startDate, setStartDate] = useState(oneWeekAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const fetchMeals = useCallback(async () => {
    // Basic validation: ensure end date is not before start date
    if (new Date(endDate) < new Date(startDate)) {
        setError("End date cannot be earlier than start date.");
        setMeals([]); // Clear meals if dates are invalid
        return;
    }

    setIsLoading(true);
    setError('');
    try {
      console.log(`Fetching meals from ${startDate} to ${endDate}`);
      // Pass date range to service
      const fetchedMeals = await mealService.getUserMeals({ startDate, endDate });
      setMeals(fetchedMeals || []);
    } catch (err) {
      console.error('Failed to fetch meal history:', err);
      setError('Failed to load meal history. Please try again.');
      setMeals([]); // Clear meals on error
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]); // Dependencies: fetch when dates change

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]); // Fetch meals when component mounts or fetchMeals changes

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm("Are you sure you want to delete this meal?")) {
      return;
    }
    try {
      await mealService.deleteMeal(mealId);
      // Refetch meals for the current date range after deletion
      fetchMeals();
    } catch (err) {
      console.error('Failed to delete meal:', err);
      setError('Failed to delete meal. Please try again.');
    }
  };

  return (
    <div className="meal-history">
      <h1>Meal History</h1>

      <div className="filters-container card">
        <h2>Select Date Range</h2>
        <div className="date-filters">
          <div className="form-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate} // Prevent start date from being after end date
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate} // Prevent end date from being before start date
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
            />
          </div>
          {/* Button to trigger fetch manually if needed, though useEffect handles it */}
          {/* <button onClick={fetchMeals} disabled={isLoading}>Load History</button> */}
        </div>
      </div>

      {isLoading && <div className="loading">Loading meal history...</div>}
      {error && <div className="error-message">{error}</div>}

      {!isLoading && !error && (
        // Use MealCalendar to display the fetched meals grouped by day
        <MealCalendar
            meals={meals}
            onDeleteMeal={handleDeleteMeal}
            userGoal={user?.calorieGoal || 2000} // Pass user's goal
        />
      )}
       {!isLoading && !error && meals.length === 0 && (
         <p className="no-meals-history">No meals found for the selected date range.</p>
       )}
    </div>
  );
};

export default MealHistory;