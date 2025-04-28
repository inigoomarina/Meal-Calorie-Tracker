import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';
import TransitionModal from '../components/TransitionModal';
import './MealHistory.css';

const MealHistory = () => {
  const { user } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to 7 days ago
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // Today
  });
  
  // State for the detail modal
  const [selectedDay, setSelectedDay] = useState(null);
  
  useEffect(() => {
    fetchMeals();
  }, [startDate, endDate]);
  
  const fetchMeals = async () => {
    setLoading(true);
    try {
      const fetchedMeals = await mealService.getUserMeals({
        startDate,
        endDate,
        _t: new Date().getTime() // Cache buster
      });
      setMeals(Array.isArray(fetchedMeals) ? fetchedMeals : []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch meals:', err);
      setError('Failed to load your meal history. Please try again.');
      setMeals([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Group meals by date
  const getMealsByDate = () => {
    const mealsByDate = {};
    
    meals.forEach(meal => {
      try {
        // Get date string in YYYY-MM-DD format
        const mealDate = new Date(meal.date || meal.time || meal.createdAt);
        if (isNaN(mealDate.getTime())) {
          return; // Skip invalid dates
        }
        
        const dateStr = mealDate.toISOString().split('T')[0];
        
        if (!mealsByDate[dateStr]) {
          mealsByDate[dateStr] = {
            date: dateStr,
        const dayData = mealsByDate[date];
        const isOverLimit = dayData.calories > calorieGoal;
        
        return (
          <div key={date} className="calendar-day-card">
            <div className="calendar-date">
              <h3>{formatDate(date)}</h3>
            </div>
            
            <div className={`calendar-summary ${isOverLimit ? 'over-limit' : 'under-limit'}`}>
              <div className="day-calories">
                <strong>{Math.round(dayData.calories)}</strong> calories
                <span className="goal-status">
                  {isOverLimit ? 
                    `(${Math.round(dayData.calories - calorieGoal)} over goal)` : 
                    `(${Math.round(calorieGoal - dayData.calories)} under goal)`}
                </span>
              </div>
              
              <div className="day-macros">
                <div className="macro-item"><span>Protein:</span> {dayData.protein.toFixed(1)}g</div>
                <div className="macro-item"><span>Carbs:</span> {dayData.carbs.toFixed(1)}g</div>
                <div className="macro-item"><span>Fat:</span> {dayData.fat.toFixed(1)}g</div>
              </div>
            </div>
            
            <div className="day-meals">
              <h4>Meals ({dayData.meals.length})</h4>
              <ul>
                {dayData.meals.map(meal => (
                  <li key={meal._id} className="meal-item">
                    <div className="meal-info">
                      <div className="meal-name">{meal.name}</div>
                      <div className="meal-calories">{meal.calories} cal</div>
                    </div>
                    <button 
                      className="btn-delete" 
                      onClick={() => onDeleteMeal(meal._id)}
                      title="Delete this meal"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
      
      // Make sure we have valid data
      if (Array.isArray(response)) {
        setMeals(response);
        console.log(`Loaded ${response.length} meals for history view`);
      } else {
        throw new Error("Invalid response format from server");
      }
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