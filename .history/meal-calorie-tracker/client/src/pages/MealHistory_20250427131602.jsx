import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';
import './MealHistory.css';

// MealHistoryCard Component
const MealHistoryCard = ({ dayData, calorieGoal, onViewDetails }) => {
  const calorieStatus = dayData.totalCalories > calorieGoal ? 'over' : 'under';
  const diffAmount = Math.abs(dayData.totalCalories - calorieGoal).toFixed(0);
  
  return (
    <div 
      className={`history-card ${calorieStatus}-goal`}
      onClick={() => onViewDetails(dayData)}
    >
      <div className="history-card-date">
        <h3>{dayData.dateFormatted}</h3>
      </div>
      
      <div className="history-card-calories">
        <span className="total-calories">{Math.round(dayData.totalCalories)}</span>
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
          <span>P: {dayData.macros.protein.toFixed(0)}g</span>
          <span>C: {dayData.macros.carbs.toFixed(0)}g</span>
          <span>F: {dayData.macros.fat.toFixed(0)}g</span>
        </div>
        <div className="meal-count">
          {dayData.meals.length} {dayData.meals.length === 1 ? 'meal' : 'meals'}
        </div>
      </div>
      
      <div className="history-card-action">
        <span className="view-details">View Details</span>
      </div>
    </div>
  );
};

// Modal component for detailed meal info
const MealDetailModal = ({ day, onClose }) => {
  if (!day) return null;

  return (
    <div className="meal-detail-overlay" onClick={onClose}>
      <div className="meal-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="meal-detail-header">
          <h2>{day.dateFormatted}</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">×</button>
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
                  <span>Protein: {parseFloat(meal.protein || meal.nutrition?.protein || 0).toFixed(1)}g</span>
                  <span>Carbs: {parseFloat(meal.carbs || meal.nutrition?.carbs || 0).toFixed(1)}g</span>
                  <span>Fat: {parseFloat(meal.fat || meal.nutrition?.fat || 0).toFixed(1)}g</span>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 30 days
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0] // Today
  );
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Process meals into daily data
  const processMealData = (mealsData) => {
    const dayMap = {};
    
    mealsData.forEach(meal => {
      try {
        // Ensure we have a valid date from meal
        const mealDate = new Date(meal.date || meal.time || meal.createdAt);
        if (isNaN(mealDate.getTime())) return;
        
        // Get date string (YYYY-MM-DD) for grouping
        const dateStr = mealDate.toISOString().split('T')[0];
        
        // Initialize day data if it doesn't exist
        if (!dayMap[dateStr]) {
          dayMap[dateStr] = {
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
        
        // Add meal to the day
        dayMap[dateStr].meals.push(meal);
        
        // Update day totals
        dayMap[dateStr].totalCalories += meal.calories || 0;
        dayMap[dateStr].macros.protein += parseFloat(meal.protein || meal.nutrition?.protein || 0);
        dayMap[dateStr].macros.carbs += parseFloat(meal.carbs || meal.nutrition?.carbs || 0);
        dayMap[dateStr].macros.fat += parseFloat(meal.fat || meal.nutrition?.fat || 0);
        dayMap[dateStr].macros.fiber += parseFloat(meal.fiber || meal.nutrition?.fiber || 0);
        dayMap[dateStr].macros.sugar += parseFloat(meal.sugar || meal.nutrition?.sugar || 0);
      } catch (err) {
        console.error("Error processing meal:", err, meal);
      }
    });
    
    // Convert map to array and sort by date (newest first)
    return Object.values(dayMap).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };
  
  // Load meal data
  const loadMealHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await mealService.getUserMeals({
        startDate,
        endDate
      });
      
      setMeals(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Failed to fetch meal history:", err);
      setError("Could not load your meal history. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize data load
  useEffect(() => {
    loadMealHistory();
  }, [startDate, endDate]);
  
  // Process daily meal data
  const dayData = processMealData(meals);
  
  // Handle card click to open detail modal
  const handleViewDetails = (day) => {
    setSelectedDay(day);
  };
  
  // Close detail modal
  const handleCloseModal = () => {
    setSelectedDay(null);
  };
  
  return (
    <div className="meal-history">
      <h1>Meal History</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="filters-container">
        <div className="date-filters">
          <div className="form-group">
            <label htmlFor="startDate">From:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">To:</label>
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

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your meal history...</p>
        </div>
      ) : dayData.length === 0 ? (
        <div className="no-data-message">
          <p>No meals found for this date range.</p>
        </div>
      ) : (
        <div className="history-cards-grid">
          {dayData.map((day, index) => (
            <MealHistoryCard
              key={day.date}
              dayData={day}
              calorieGoal={user?.calorieGoal || 2000}
              onViewDetails={handleViewDetails}
              style={{'--card-index': index}} // For staggered animation
            />
          ))}
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