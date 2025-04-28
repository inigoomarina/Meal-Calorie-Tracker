import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';
import MealCalendar from '../components/MealCalendar';
import './MealHistory.css';

const MealHistory = () => {
  const { user } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Date range for filtering meals
  const [dateRange, setDateRange] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate()
  });
  
  // Get date from 30 days ago as default start date
  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }
  
  // Get today's date as default end date
  function getDefaultEndDate() {
    return new Date().toISOString().split('T')[0];
  }
  
  // Load meal history data
  useEffect(() => {
    loadMeals();
  }, []);
  
  // Function to load meals based on filter criteria
  const loadMeals = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await mealService.getMealHistory({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      setMeals(response);
      console.log("Meal history loaded:", response);
    } catch (err) {
      console.error('Failed to load meal history:', err);
      setError('Failed to load meal history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle date filter changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle filter form submission
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadMeals();
  };
  
  // Handle meal deletion
  const handleDeleteMeal = async (mealId) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await mealService.deleteMeal(mealId);
        // Refresh meal list after deletion
        setMeals(meals.filter(meal => meal._id !== mealId));
      } catch (err) {
        console.error('Failed to delete meal:', err);
        setError('Failed to delete meal. Please try again.');
      }
    }
  };
  
  return (
    <div className="meal-history">
      <h1>Meal History</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="filters-container">
        <form className="date-filters" onSubmit={handleFilterSubmit}>
          <div className="form-group">
            <label htmlFor="startDate">From:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">To:</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Apply Filter
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="loading">Loading meal history...</div>
      ) : (
        <MealCalendar meals={meals} onDeleteMeal={handleDeleteMeal} />
      )}
    </div>
  );
};

export default MealHistory;