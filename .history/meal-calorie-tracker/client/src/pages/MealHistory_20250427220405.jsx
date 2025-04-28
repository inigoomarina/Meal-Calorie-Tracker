import { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import mealService from '@/services/mealService';
import { AuthContext } from '@/context/AuthContext.jsx';
import MealCalendar from '@/components/MealCalendar';
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

  // Use useCallback to memoize fetchMeals
  const fetchMeals = useCallback(async (start, end) => {
    setIsLoading(true);
    setError('');
    try {
      console.log(`Fetching meals from ${start} to ${end}`);
      // Ensure dates are valid before fetching
      if (!start || !end || new Date(start) > new Date(end)) {
         throw new Error("Invalid date range selected.");
      }
      // Pass the current start and end dates directly
      const fetchedMeals = await mealService.getUserMeals({ startDate: start, endDate: end });
      setMeals(fetchedMeals || []);
    } catch (err) {
      console.error('Failed to fetch meal history:', err);
      setError(`Failed to load meal history: ${err.message}. Please try again.`);
      setMeals([]); // Clear meals on error
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed here as we pass dates directly

  useEffect(() => {
    // Fetch meals when the component mounts or when dates change
    fetchMeals(startDate, endDate);
  }, [startDate, endDate, fetchMeals]); // Add fetchMeals to dependency array

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm("Are you sure you want to delete this meal?")) {
      return;
    }
    try {
      await mealService.deleteMeal(mealId);
      // Refetch meals for the current date range after deletion
      fetchMeals(startDate, endDate); 
    } catch (err) {
      console.error('Failed to delete meal:', err);
      setError('Failed to delete meal. Please try again.');
    }
  };

  // Handler for start date change
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    // Basic validation: ensure start date is not after end date
    if (new Date(newStartDate) <= new Date(endDate)) {
      setStartDate(newStartDate);
    } else {
      // Optionally provide feedback or reset end date
      setStartDate(newStartDate);
      setEndDate(newStartDate); // Set end date to start date if invalid range
    }
  };

  // Handler for end date change
  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    // Basic validation: ensure end date is not before start date and not in the future
    const todayStr = new Date().toISOString().split('T')[0];
    if (new Date(newEndDate) >= new Date(startDate) && new Date(newEndDate) <= new Date(todayStr)) {
      setEndDate(newEndDate);
    } else {
       // Optionally provide feedback
       // Reset to today if future date selected
       if (new Date(newEndDate) > new Date(todayStr)) {
         setEndDate(todayStr);
       }
       // Or reset to start date if before start date
       // else if (new Date(newEndDate) < new Date(startDate)) {
       //   setEndDate(startDate);
       // }
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
              onChange={handleStartDateChange} // Use specific handler
              max={endDate} 
            />
          </div>
          <div className="date-input">
            <label htmlFor="endDate">End Date:</label>
            <input 
              type="date" 
              id="endDate" 
              value={endDate} 
              onChange={handleEndDateChange} // Use specific handler
              min={startDate} 
              max={new Date().toISOString().split('T')[0]} 
            />
          </div>
          {/* Removed manual load button, fetch triggers on date change */}
        </div>
      </div>

      {isLoading && <div className="loading-container">Loading meal history...</div>}
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && meals.length > 0 && (
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