import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import mealService from '../services/mealService';
import ModalTransition from '../components/ModalTransition';
import './MealHistory.css';

const MealDetailModal = ({ day, onClose, isOpen }) => {
  if (!day) return null;

  return (
    <ModalTransition isOpen={isOpen} onClose={onClose}>
      <div className="meal-detail-modal">
        <div className="modal-header">
          <h2>{day.dateFormatted}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="detail-summary">
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
          <div className="detail-meal-list">
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
    </ModalTransition>
  );
};

const MealHistory = () => {
  const { user } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async (start = '', end = '') => {
    setIsLoading(true);
    try {
      const params = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;
      
      const data = await mealService.getUserMeals(params);
      setMeals(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching meals:', err);
      setError('Failed to load meal history. Please try again.');
      setMeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    fetchMeals(filterStartDate, filterEndDate);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      setFilterStartDate(value);
    } else if (name === 'endDate') {
      setFilterEndDate(value);
    }
  };

  const groupMealsByDay = () => {
    const mealsByDay = {};
    
    meals.forEach(meal => {
      const date = new Date(meal.time || meal.date || meal.createdAt);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date found in meal:", meal);
        return;
      }
      
      const dateStr = date.toISOString().split('T')[0];
      
      if (!mealsByDay[dateStr]) {
        mealsByDay[dateStr] = {
          date: dateStr,
          dateFormatted: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          meals: [],
          totalCalories: 0,
          macros: {
            protein: 0,
            carbs: 0,
            fat: 0
          }
        };
      }
      
      mealsByDay[dateStr].meals.push(meal);
      mealsByDay[dateStr].totalCalories += meal.calories || 0;
      mealsByDay[dateStr].macros.protein += parseFloat(meal.protein || meal.nutrition?.protein || 0);
      mealsByDay[dateStr].macros.carbs += parseFloat(meal.carbs || meal.nutrition?.carbs || 0);
      mealsByDay[dateStr].macros.fat += parseFloat(meal.fat || meal.nutrition?.fat || 0);
    });
    
    return mealsByDay;
  };

  const handleViewDetail = (day) => {
    setSelectedDay(day);
  };

  const handleCloseModal = () => {
    setSelectedDay(null);
  };

  const mealsByDay = groupMealsByDay();
  const sortedDays = Object.values(mealsByDay).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const calorieGoal = user?.calorieGoal || 2000;

  return (
    <div className="meal-history-page">
      <h1>Meal History</h1>
      
      <div className="filters-container">
        <div className="date-filters">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filterStartDate}
              onChange={handleDateChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filterEndDate}
              onChange={handleDateChange}
            />
          </div>
          <button className="btn btn-primary" onClick={handleFilter}>Filter</button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading meal history...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : sortedDays.length === 0 ? (
        <div className="no-meals-message">No meals found for the selected period.</div>
      ) : (
        <div className="history-grid">
          {sortedDays.map(day => {
            const isOverCalorieGoal = day.totalCalories > calorieGoal;
            
            return (
              <div 
                key={day.date} 
                className={`history-card ${isOverCalorieGoal ? 'over-limit' : 'under-limit'}`}
                onClick={() => handleViewDetail(day)}
              >
                <div className="history-card-date">
                  <h3>{day.dateFormatted.split(',')[0]}</h3>
                  <p>{day.dateFormatted.split(',')[1]}</p>
                </div>
                
                <div className="history-card-calories">
                  <h2>{Math.round(day.totalCalories)} <span>cal</span></h2>
                  <div className="calorie-status">
                    {isOverCalorieGoal ? (
                      <span className="over">{Math.round(day.totalCalories - calorieGoal)} over goal</span>
                    ) : (
                      <span className="under">{Math.round(calorieGoal - day.totalCalories)} under goal</span>
                    )}
                  </div>
                </div>
                
                <div className="history-card-meals">
                  <span>{day.meals.length} {day.meals.length === 1 ? 'meal' : 'meals'}</span>
                  <button className="btn-view">View Details</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed view modal - Using our compatibility wrapper */}
      <MealDetailModal 
        day={selectedDay} 
        onClose={handleCloseModal} 
        isOpen={!!selectedDay}
      />
    </div>
  );
};

export default MealHistory;