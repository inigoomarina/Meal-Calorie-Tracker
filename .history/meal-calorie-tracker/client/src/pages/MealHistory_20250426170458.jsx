import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';
import './MealHistory.css';

// Modal component for detailed meal info
const MealDetailModal = ({ day, onClose }) => {
  if (!day) return null;

  return (
    <div className="meal-detail-overlay" onClick={onClose}>
      <div className="meal-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="meal-detail-header">
          <h2>{day.dateFormatted}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="meal-detail-summary">
          <div className="detail-stat">
            <span className="label">Calories</span>
            <span className="value">{Math.round(day.totalCalories)}</span>
          </div>
          <div className="detail-stat">
            <span className="label">Protein</span>
            <span className="value">{day.macros.protein.toFixed(1)}g</span>
          </div>
          <div className="detail-stat">
            <span className="label">Carbs</span>
            <span className="value">{day.macros.carbs.toFixed(1)}g</span>
          </div>
          <div className="detail-stat">
            <span className="label">Fat</span>
            <span className="value">{day.macros.fat.toFixed(1)}g</span>
          </div>
        </div>
        
        <h3>Meals</h3>
        <div className="meal-detail-list">
          {day.meals.length > 0 ? (
            day.meals.map(meal => (
              <div key={meal._id} className="detail-meal-item">
                <div className="detail-meal-header">
                  <h4>{meal.name}</h4>
                  <span className="detail-meal-calories">{meal.calories} cal</span>
                </div>
                <div className="detail-meal-time">
                  {new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="detail-meal-macros">
                  <span>Protein: {(meal.protein || meal.nutrition?.protein || 0).toFixed(1)}g</span>
                  <span>Carbs: {(meal.carbs || meal.nutrition?.carbs || 0).toFixed(1)}g</span>
                  <span>Fat: {(meal.fat || meal.nutrition?.fat || 0).toFixed(1)}g</span>
                </div>
              </div>
            ))
          ) : (
            <p>No meals recorded for this day.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const MealHistory = () => {
  const { user } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0], // Today
  });
  const [selectedDay, setSelectedDay] = useState(null);
  
  useEffect(() => {
    const fetchMeals = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const mealsData = await mealService.getUserMeals({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });
        
        setMeals(Array.isArray(mealsData) ? mealsData : []);
      } catch (err) {
        console.error('Error fetching meal history:', err);
        setError('Failed to load meal history. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMeals();
  }, [dateRange]);
  
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Group meals by date
  const getMealsByDate = () => {
    const mealsByDate = {};
    
    meals.forEach(meal => {
      try {
        // Get date string (YYYY-MM-DD) from meal date
        const mealDate = new Date(meal.date || meal.time || meal.createdAt);
        if (isNaN(mealDate.getTime())) return;
        
        const dateStr = mealDate.toISOString().split('T')[0];
        
        if (!mealsByDate[dateStr]) {
          mealsByDate[dateStr] = {
            date: dateStr,
            dateFormatted: new Date(dateStr).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            }),
            totalCalories: 0,
            meals: [],
            macros: {
              protein: 0,
              carbs: 0,
              fat: 0,
              fiber: 0,
              sugar: 0
            }
          };
        }
        
        // Add meal to the day and update totals
        mealsByDate[dateStr].meals.push(meal);
        mealsByDate[dateStr].totalCalories += meal.calories || 0;
        
        // Update macros
        mealsByDate[dateStr].macros.protein += parseFloat(meal.protein || meal.nutrition?.protein || 0);
        mealsByDate[dateStr].macros.carbs += parseFloat(meal.carbs || meal.nutrition?.carbs || 0);
        mealsByDate[dateStr].macros.fat += parseFloat(meal.fat || meal.nutrition?.fat || 0);
        mealsByDate[dateStr].macros.fiber += parseFloat(meal.fiber || meal.nutrition?.fiber || 0);
        mealsByDate[dateStr].macros.sugar += parseFloat(meal.sugar || meal.nutrition?.sugar || 0);
      } catch (error) {
        console.error("Error processing meal:", error, meal);
      }
    });
    
    return mealsByDate;
  };
  
  const deleteMeal = async (mealId) => {
    if (!mealId || !window.confirm('Are you sure you want to delete this meal?')) {
      return;
    }
    
    try {
      await mealService.deleteMeal(mealId);
      setMeals(prevMeals => prevMeals.filter(meal => meal._id !== mealId));
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError('Failed to delete meal. Please try again.');
    }
  };
  
  const mealsByDate = getMealsByDate();
  const sortedDates = Object.keys(mealsByDate).sort((a, b) => new Date(b) - new Date(a));
  
  // Handle card click to show details
  const handleDayCardClick = (day) => {
    setSelectedDay(day);
  };
  
  // Close the detailed modal
  const handleCloseModal = () => {
    setSelectedDay(null);
  };
  
  if (isLoading) return <div className="loading">Loading meal history...</div>;
  
  return (
    <div className="meal-history">
      <h1>Meal History</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="filters-container">
        <div className="date-filters">
          <div className="form-group">
            <label htmlFor="startDate">From</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              max={dateRange.endDate}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">To</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              min={dateRange.startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>

      {sortedDates.length > 0 ? (
        <div className="history-grid">
          {sortedDates.map(date => {
            const day = mealsByDate[date];
            const calorieGoal = user?.calorieGoal || 2000;
            const calorieStatus = day.totalCalories > calorieGoal ? 'over' : 'under';
            const diffAmount = Math.abs(day.totalCalories - calorieGoal).toFixed(0);
            
            return (
              <div 
                key={date} 
                className={`history-card ${calorieStatus}-goal`}
                onClick={() => handleDayCardClick(day)}
              >
                <div className="history-card-date">
                  <h3>{day.dateFormatted}</h3>
                </div>
                
                <div className="history-card-calories">
                  <span className="total-calories">{Math.round(day.totalCalories)}</span>
                  <span className="calories-unit">calories</span>
                </div>
                
                <div className="history-card-status">
                  {calorieStatus === 'over' ? (
                    <span className="over-message">{diffAmount} over goal</span>
                  ) : (
                    <span className="under-message">{diffAmount} under goal</span>
                  )}
                </div>
                
                <div className="history-card-info">
                  <div className="macro-summary">
                    <span>P: {day.macros.protein.toFixed(0)}g</span>
                    <span>C: {day.macros.carbs.toFixed(0)}g</span>
                    <span>F: {day.macros.fat.toFixed(0)}g</span>
                  </div>
                  <div className="meal-count">
                    {day.meals.length} {day.meals.length === 1 ? 'meal' : 'meals'}
                  </div>
                </div>
                
                <div className="history-card-action">
                  <span className="view-details">View Details</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-meals-message">
          No meals found for the selected date range.
        </div>
      )}
      
      {/* Detailed view modal */}
      {selectedDay && (
        <MealDetailModal day={selectedDay} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default MealHistory;