import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import mealService from '../services/mealService';
import './MealHistory.css';

const MealDetailModal = ({ meal, onClose }) => {
  if (!meal) return null;
  
  return (
    <div className="meal-detail-overlay" onClick={onClose}>
      <div className="meal-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="meal-detail-header">
          <h3>{meal.date}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="meal-detail-content">
          <div className="meal-detail-summary">
            <div className="detail-item">
              <span className="label">Total Calories:</span>
              <span className="value">{meal.totalCalories}</span>
            </div>
            <div className="detail-item">
              <span className="label">Calorie Goal:</span>
              <span className="value">{meal.calorieGoal}</span>
            </div>
            <div className={`detail-item status ${meal.isOverGoal ? 'over' : 'under'}`}>
              <span className="label">Status:</span>
              <span className="value">
                {meal.isOverGoal 
                  ? `${meal.overAmount} calories over goal` 
                  : `${meal.underAmount} calories under goal`}
              </span>
            </div>
          </div>
          
          <div className="macro-breakdown">
            <h4>Macro Breakdown</h4>
            <div className="macro-grid">
              <div className="macro-item">
                <span className="macro-label">Protein</span>
                <span className="macro-value">{meal.totalProtein.toFixed(1)}g</span>
                <div className="macro-bar">
                  <div 
                    className="macro-progress" 
                    style={{ 
                      width: `${Math.min(100, (meal.totalProtein / (meal.proteinGoal || 100)) * 100)}%`,
                      backgroundColor: '#4285F4'
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="macro-item">
                <span className="macro-label">Carbs</span>
                <span className="macro-value">{meal.totalCarbs.toFixed(1)}g</span>
                <div className="macro-bar">
                  <div 
                    className="macro-progress" 
                    style={{ 
                      width: `${Math.min(100, (meal.totalCarbs / (meal.carbsGoal || 150)) * 100)}%`,
                      backgroundColor: '#34A853'
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="macro-item">
                <span className="macro-label">Fat</span>
                <span className="macro-value">{meal.totalFat.toFixed(1)}g</span>
                <div className="macro-bar">
                  <div 
                    className="macro-progress" 
                    style={{ 
                      width: `${Math.min(100, (meal.totalFat / (meal.fatGoal || 70)) * 100)}%`,
                      backgroundColor: '#FBBC05'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="meal-list">
            <h4>Meals</h4>
            {meal.meals.map((mealItem, index) => (
              <div key={index} className="meal-item-card">
                <div className="meal-item-header">{mealItem.name}</div>
                <div className="meal-item-details">
                  <div className="detail">
                    <span>Calories:</span> {mealItem.calories}
                  </div>
                  <div className="meal-item-macros">
                    <span>P: {parseFloat(mealItem.nutrition?.protein || mealItem.protein || 0).toFixed(1)}g</span>
                    <span>C: {parseFloat(mealItem.nutrition?.carbs || mealItem.carbs || 0).toFixed(1)}g</span>
                    <span>F: {parseFloat(mealItem.nutrition?.fat || mealItem.fat || 0).toFixed(1)}g</span>
                  </div>
                  <div className="meal-time">
                    {new Date(mealItem.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MealHistoryCard = ({ dayData, onViewDetails }) => {
  const { date, totalCalories, calorieGoal, isOverGoal, overAmount, underAmount } = dayData;
  
  return (
    <div className={`history-card ${isOverGoal ? 'over-goal' : 'under-goal'}`} 
      onClick={() => onViewDetails(dayData)}
    >
      <div className="history-card-date">{date}</div>
      <div className="history-card-calories">
        <span className="calorie-value">{totalCalories}</span>
        <span className="calorie-unit">calories</span>
      </div>
      <div className="history-card-status">
        {isOverGoal
          ? <div className="over-indicator">+{overAmount} over goal</div>
          : <div className="under-indicator">{underAmount} under goal</div>
        }
      </div>
      <button className="view-details-btn">View Details</button>
    </div>
  );
};

const MealHistory = () => {
  const { user } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDateMeals, setSelectedDateMeals] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to 7 days ago
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // Today
  });

  // Fetch meals data
  useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      setError('');
      
      try {
        const fetchedMeals = await mealService.getUserMeals({
          startDate,
          endDate,
        });
        
        setMeals(fetchedMeals);
      } catch (err) {
        console.error('Failed to fetch meal history:', err);
        setError('Failed to load your meal history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, [startDate, endDate]);

  // Process and group meals by date
  const mealsByDate = meals.reduce((acc, meal) => {
    try {
      const mealDate = new Date(meal.time || meal.date || meal.createdAt);
      const dateStr = mealDate.toISOString().split('T')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: mealDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          }),
          meals: [],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          calorieGoal: user?.calorieGoal || 2000,
          proteinGoal: user?.proteinGoal || 100,
          carbsGoal: user?.carbsGoal || 150,
          fatGoal: user?.fatGoal || 70,
        };
      }
      
      acc[dateStr].meals.push(meal);
      acc[dateStr].totalCalories += meal.calories || 0;
      acc[dateStr].totalProtein += parseFloat(meal.nutrition?.protein || meal.protein || 0);
      acc[dateStr].totalCarbs += parseFloat(meal.nutrition?.carbs || meal.carbs || 0);
      acc[dateStr].totalFat += parseFloat(meal.nutrition?.fat || meal.fat || 0);
      
      // Calculate if over/under goal
      const isOverGoal = acc[dateStr].totalCalories > acc[dateStr].calorieGoal;
      acc[dateStr].isOverGoal = isOverGoal;
      acc[dateStr].overAmount = isOverGoal ? 
        Math.round(acc[dateStr].totalCalories - acc[dateStr].calorieGoal) : 0;
      acc[dateStr].underAmount = !isOverGoal ? 
        Math.round(acc[dateStr].calorieGoal - acc[dateStr].totalCalories) : 0;
      
      return acc;
    } catch (error) {
      console.error("Error processing meal:", error);
      return acc;
    }
  }, {});
  
  // Sort dates in reverse chronological order
  const sortedDates = Object.keys(mealsByDate).sort((a, b) => new Date(b) - new Date(a));
  const sortedDayData = sortedDates.map(date => mealsByDate[date]);
  
  // Handle view details button click
  const handleViewDetails = (dayData) => {
    setSelectedDateMeals(dayData);
  };
  
  // Handle closing the details modal
  const handleCloseDetails = () => {
    setSelectedDateMeals(null);
  };

  return (
    <div className="meal-history">
      <h1>Meal History</h1>
      
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
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : sortedDayData.length === 0 ? (
        <div className="no-data-message">
          <p>No meals found for this date range.</p>
        </div>
      ) : (
        <div className="history-cards-grid">
          {sortedDayData.map((dayData, index) => (
            <MealHistoryCard
              key={index}
              dayData={dayData}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
      
      {selectedDateMeals && (
        <MealDetailModal 
          meal={selectedDateMeals}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default MealHistory;