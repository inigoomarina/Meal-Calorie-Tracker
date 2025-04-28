import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const MealCalendar = ({ meals, onViewMeal, onDeleteMeal }) => {
  const { user } = useContext(AuthContext);
  
  // Group meals by date
  const groupMealsByDate = () => {
    const grouped = {};
    
    meals.forEach(meal => {
      const date = new Date(meal.time).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = {
          meals: [],
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        };
      }
      
      // Add meal to the day
      grouped[date].meals.push(meal);
      
      // Add nutrition values
      grouped[date].calories += parseInt(meal.calories) || 0;
      grouped[date].protein += parseFloat(meal.nutrition?.protein || meal.protein || 0);
      grouped[date].carbs += parseFloat(meal.nutrition?.carbs || meal.carbs || 0);
      grouped[date].fat += parseFloat(meal.nutrition?.fat || meal.fat || 0);
    });
    
    return grouped;
  };
  
  const dailyMeals = groupMealsByDate();
  const dates = Object.keys(dailyMeals).sort((a, b) => new Date(b) - new Date(a));
  
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  if (dates.length === 0) {
    return <div className="no-meals-message">No meal history found.</div>;
  }

  return (
    <div className="calendar-view">
      {dates.map(date => {
        const dayData = dailyMeals[date];
        const calorieGoal = user?.calorieGoal || 2000;
        const isOverLimit = dayData.calories > calorieGoal;
        
        return (
          <div key={date} className="calendar-day">
            <div className="calendar-date">
              <h3>{formatDate(date)}</h3>
            </div>
            <div className={`calendar-totals ${isOverLimit ? 'over-limit' : 'under-limit'}`}>
              <div className="total-item">
                <span>Calories:</span> {Math.round(dayData.calories)}
                <span className="goal-indicator">
                  {isOverLimit 
                    ? `(${Math.round(dayData.calories - calorieGoal)} over goal)` 
                    : `(${Math.round(calorieGoal - dayData.calories)} under goal)`}
                </span>
              </div>
              <div className="total-item"><span>Protein:</span> {dayData.protein.toFixed(1)}g</div>
              <div className="total-item"><span>Carbs:</span> {dayData.carbs.toFixed(1)}g</div>
              <div className="total-item"><span>Fat:</span> {dayData.fat.toFixed(1)}g</div>
            </div>
            <div className="calendar-meals">
              <h4>Meals</h4>
              <ul>
                {dayData.meals.map(meal => (
                  <li key={meal._id} className="calendar-meal">
                    <div className="meal-name">{meal.name}</div>
                    <div className="meal-calories">{meal.calories} cal</div>
                    <div className="meal-actions">
                      {onViewMeal && (
                        <button 
                          className="btn btn-small" 
                          onClick={() => onViewMeal(meal)}
                        >
                          View
                        </button>
                      )}
                      {onDeleteMeal && (
                        <button 
                          className="btn btn-small btn-delete" 
                          onClick={() => onDeleteMeal(meal._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
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

export default MealCalendar;
