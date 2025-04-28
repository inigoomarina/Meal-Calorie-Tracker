import { useState, useEffect, useContext } from 'react';
import mealService from '../services/mealService';
import MealCalendar from '../components/MealCalendar'; // Assuming MealCalendar is used here
import { AuthContext } from '../context/AuthContext.jsx';
import './MealHistory.css';

const MealHistory = () => {
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { user } = useContext(AuthContext); // Get user for goal context if needed by children

  const fetchHistory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      console.log("Fetching meal history with filters:", filters);
      const historyData = await mealService.getMealHistory(filters);
      console.log("Meal history data received:", historyData);
      setMeals(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Failed to load meal history:', err);
      setError('Failed to load meal history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set default date range (e.g., last 30 days) or fetch all on initial load
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    
    // Fetch initial data
    fetchHistory(); 
  }, []); // Fetch only on initial mount

  const handleFilterChange = () => {
    fetchHistory(); // Refetch when dates change
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm("Are you sure you want to delete this meal?")) {
      return;
    }
    try {
      await mealService.deleteMeal(mealId);
      // Refetch history after deletion
      fetchHistory(); 
    } catch (err) {
      console.error("Failed to delete meal:", err);
      setError("Failed to delete meal. Please try again.");
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
          <button onClick={handleFilterChange} className="btn btn-secondary">Apply Filters</button>
        </div>
        {/* Add view controls if needed */}
      </div>

      {isLoading && <div className="loading">Loading history...</div>}
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && (
        // Use MealCalendar component to display grouped meals
        <MealCalendar meals={meals} onDeleteMeal={handleDeleteMeal} />
        // Or implement table view logic here if preferred
      )}
    </div>
  );
};

export default MealHistory;