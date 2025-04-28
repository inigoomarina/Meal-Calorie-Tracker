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
            dateFormatted: formatDate(dateStr),
            meals: [],
            totalCalories: 0,
            macros: {
              protein: 0,
              carbs: 0,
              fat: 0
            }
          };
        }
        
        // Add meal to the day and update totals
        mealsByDate[dateStr].meals.push(meal);
        mealsByDate[dateStr].totalCalories += meal.calories || 0;
        
        // Add macros
        mealsByDate[dateStr].macros.protein += parseFloat(meal.protein || meal.nutrition?.protein || 0);
        mealsByDate[dateStr].macros.carbs += parseFloat(meal.carbs || meal.nutrition?.carbs || 0);
        mealsByDate[dateStr].macros.fat += parseFloat(meal.fat || meal.nutrition?.fat || 0);
      } catch (error) {
        console.error("Error processing meal:", error);
      }
    });
    
    return mealsByDate;
  };
  
  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const formatMealTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return "Invalid time";
    }
  };
  
  const handleViewDayDetails = (day) => {
    setSelectedDay(day);
  };
  
  const handleCloseModal = () => {
    setSelectedDay(null);
  };
  
  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Are you sure you want to delete this meal?')) {
      return;
    }
    
    try {
      await mealService.deleteMeal(mealId);
      // Refresh the data
      fetchMeals();
    } catch (err) {
      console.error('Failed to delete meal:', err);
      alert('Failed to delete the meal. Please try again.');
    }
  };
  
  const mealsByDate = getMealsByDate();
  const days = Object.values(mealsByDate).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  const calorieGoal = user?.calorieGoal || 2000;
  
  return (
    <div className="meal-history">
      <h1>Meal History</h1>
      
      <div className="filters-container">
        <div className="date-filters">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input 
              type="date" 
              id="startDate" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input 
              type="date" 
              id="endDate" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>
      
      {loading && <div className="loading">Loading your meal history...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && days.length === 0 && (
        <div className="no-data">No meals found in the selected date range.</div>
      )}
      
      {!loading && !error && days.length > 0 && (
        <div className="meal-history-grid">
          {days.map(day => {
            const isOverLimit = day.totalCalories > calorieGoal;
            const difference = Math.abs(day.totalCalories - calorieGoal);
            
            return (
              <div 
                key={day.date} 
                className={`meal-day-card ${isOverLimit ? 'over-limit' : 'under-limit'}`}
                onClick={() => handleViewDayDetails(day)}
              >
                <div className="meal-day-header">
                  <h3>{day.dateFormatted}</h3>
                </div>
                
                <div className="meal-day-summary">
                  <div className="calories-summary">
                    <span className="calories-value">{Math.round(day.totalCalories)}</span>
                    <span className="calories-label">calories</span>
                  </div>
                  
                  <div className={`calories-status ${isOverLimit ? 'over' : 'under'}`}>
                    {isOverLimit 
                      ? `${Math.round(difference)} over goal` 
                      : `${Math.round(difference)} under goal`
                    }
                  </div>
                </div>
                
                <div className="meal-count">
                  {day.meals.length} {day.meals.length === 1 ? 'meal' : 'meals'}
                </div>
                
                <button className="view-details-btn">
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Meal Day Detail Modal */}
      <TransitionModal
        isOpen={!!selectedDay}
        onClose={handleCloseModal}
        title={selectedDay?.dateFormatted}
        maxWidth="650px"
      >
        {selectedDay && (
          <div className="day-details">
            <div className="day-summary-stats">
              <div className="day-stat calories">
                <div className="stat-label">Calories</div>
                <div className="stat-value">{Math.round(selectedDay.totalCalories)}</div>
                <div className={`stat-diff ${selectedDay.totalCalories > calorieGoal ? 'negative' : 'positive'}`}>
                  {selectedDay.totalCalories > calorieGoal 
                    ? `(${Math.round(selectedDay.totalCalories - calorieGoal)} over goal)`
                    : `(${Math.round(calorieGoal - selectedDay.totalCalories)} under goal)`
                }
                </div>
              </div>
              
              <div className="day-macro-stats">
                <div className="day-stat">
                  <div className="stat-label">Protein</div>
                  <div className="stat-value">{selectedDay.macros.protein.toFixed(1)}g</div>
                </div>
                <div className="day-stat">
                  <div className="stat-label">Carbs</div>
                  <div className="stat-value">{selectedDay.macros.carbs.toFixed(1)}g</div>
                </div>
                <div className="day-stat">
                  <div className="stat-label">Fat</div>
                  <div className="stat-value">{selectedDay.macros.fat.toFixed(1)}g</div>
                </div>
              </div>
            </div>
            
            <h4 className="day-meals-title">Meals</h4>
            
            <div className="day-meals-list">
              {selectedDay.meals.length > 0 ? (
                selectedDay.meals.map(meal => (
                  <div key={meal._id} className="day-meal-item">
                    <div className="meal-item-header">
                      <h5>{meal.name}</h5>
                      <div className="meal-time">{formatMealTime(meal.time)}</div>
                    </div>
                    
                    <div className="meal-item-details">
                      <div className="meal-calories">{meal.calories} cal</div>
                      
                      <div className="meal-macros">
                        <span className="macro-item">
                          <span className="macro-label">P:</span> 
                          {parseFloat(meal.protein || meal.nutrition?.protein || 0).toFixed(1)}g
                        </span>
                        <span className="macro-item">
                          <span className="macro-label">C:</span> 
                          {parseFloat(meal.carbs || meal.nutrition?.carbs || 0).toFixed(1)}g
                        </span>
                        <span className="macro-item">
                          <span className="macro-label">F:</span> 
                          {parseFloat(meal.fat || meal.nutrition?.fat || 0).toFixed(1)}g
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      className="delete-meal-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMeal(meal._id);
                      }}
                      title="Delete this meal"
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p>No meals recorded for this day.</p>
              )}
            </div>
          </div>
        )}
      </TransitionModal>
    </div>
  );
};

export default MealHistory;