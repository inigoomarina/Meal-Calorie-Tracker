import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';
import Modal from '../components/Modal';
import './MealHistory.css';

// Extract date to display for readability
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

// Calculate if calories are over or under goal
const getCalorieStatus = (calories, goal) => {
  const diff = goal - calories;
  if (diff > 0) {
    return {
      isOver: false,
      diff,
      message: `${Math.round(diff)} under goal`
    };
  } else {
    return {
      isOver: true,
      diff: Math.abs(diff),
      message: `${Math.round(Math.abs(diff))} over goal`
    };
  }
};

// Meal history card component
const MealHistoryCard = ({ day, onClick, goal }) => {
  const status = getCalorieStatus(day.totalCalories, goal);
  const statusClass = status.isOver ? 'over-limit' : 'under-limit';
  
  return (
    <div className="history-card" onClick={() => onClick(day)}>
      <div className="history-card-date">
        {formatDate(day.date)}
      </div>
      <div className={`history-card-stats ${statusClass}`}>
        <div className="history-card-calories">
          {Math.round(day.totalCalories)} cal
        </div>
        <div className="history-card-status">
          {status.message}
        </div>
      </div>
      <div className="history-card-footer">
        <span>{day.meals.length} {day.meals.length === 1 ? 'meal' : 'meals'}</span>
        <button className="btn-view">View Details</button>
      </div>
    </div>
  );
};

// Meal detail modal component
const MealDetailModal = ({ day, onClose, isOpen }) => {
  if (!day) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={formatDate(day.date)}
      maxWidth="600px"
    >
      <div className="meal-detail-content">
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
    </Modal>
  );
};

// Main MealHistory component
const MealHistory = () => {
  const { user } = useContext(AuthContext);
  const calorieGoal = user?.calorieGoal || 2000;
  
  const [mealData, setMealData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0]; // Today
  });

  useEffect(() => {
    const fetchMealHistory = async () => {
      setIsLoading(true);
      try {
        const data = await mealService.getMealHistory(startDate, endDate);
        
        // Process data to group by date
        const groupedData = processHistoryData(data);
        setMealData(groupedData);
      } catch (err) {
        console.error('Failed to fetch meal history:', err);
        setError('Failed to load meal history. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMealHistory();
  }, [startDate, endDate]);
  
  // Process and group meal data by date
  const processHistoryData = (meals) => {
    const dayMap = {};
    
    // Group meals by date
    meals.forEach(meal => {
      try {
        const date = new Date(meal.time || meal.date);
        const dateStr = date.toISOString().split('T')[0];
        
        if (!dayMap[dateStr]) {
          dayMap[dateStr] = {
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
        
        // Add meal to the day
        dayMap[dateStr].meals.push(meal);
        
        // Update day totals
        dayMap[dateStr].totalCalories += meal.calories || 0;
        dayMap[dateStr].macros.protein += parseFloat(meal.protein || meal.nutrition?.protein || 0);
        dayMap[dateStr].macros.carbs += parseFloat(meal.carbs || meal.nutrition?.carbs || 0);
        dayMap[dateStr].macros.fat += parseFloat(meal.fat || meal.nutrition?.fat || 0);
      } catch (err) {
        console.error('Error processing meal:', err, meal);
      }
    });
    
    // Convert to array and sort by date (newest first)
    return Object.values(dayMap).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  };
  
  const handleDayClick = (day) => {
    setSelectedDay(day);
  };
  
  const handleCloseModal = () => {
    setSelectedDay(null);
  };
  
  // Handle date filter changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      setStartDate(value);
    } else if (name === 'endDate') {
      setEndDate(value);
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading meal history...</div>;
  }

  return (
    <div className="meal-history">
      <h1>Meal History</h1>
      
      <div className="history-filters">
        <div className="date-range">
          <div className="date-input">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={startDate}
              onChange={handleDateChange}
              max={endDate}
            />
          </div>
          <div className="date-input">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={endDate}
              onChange={handleDateChange}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {mealData.length === 0 ? (
        <div className="no-data-message">
          <p>No meal data available for the selected date range.</p>
          <Link to="/log-meal" className="btn-primary">Log a Meal</Link>
        </div>
      ) : (
        <div className="history-cards">
          {mealData.map(day => (
            <MealHistoryCard 
              key={day.date} 
              day={day} 
              onClick={handleDayClick} 
              goal={calorieGoal}
            />
          ))}
        </div>
      )}
      
      <MealDetailModal 
        day={selectedDay} 
        onClose={handleCloseModal} 
        isOpen={!!selectedDay}
      />
    </div>
  );
};

export default MealHistory;