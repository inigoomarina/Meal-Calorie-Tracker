import React from 'react';
import { Link } from 'react-router-dom';

// Helper function to format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

// Helper for getting nutrition values consistently
const getNutritionValue = (meal, nutrient) => {
  try {
    // Try multiple possible data paths
    if (typeof meal[nutrient] === 'number') return meal[nutrient];
    if (typeof meal[nutrient] === 'string') {
      const parsed = parseFloat(meal[nutrient]);
      if (!isNaN(parsed)) return parsed;
    }
    if (meal.nutrition && typeof meal.nutrition[nutrient] === 'number') {
      return meal.nutrition[nutrient];
    }
    if (meal.nutrition && typeof meal.nutrition[nutrient] === 'string') {
      const parsed = parseFloat(meal.nutrition[nutrient]);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  } catch (err) {
    return 0;
  }
};

// Group meals by date and calculate totals
const groupMealsByDate = (meals) => {
  const groupedMeals = {};
  
  meals.forEach(meal => {
    // Extract date part only (without time)
    const dateString = new Date(meal.time).toISOString().split('T')[0];
    
    if (!groupedMeals[dateString]) {
      groupedMeals[dateString] = {
        date: dateString,
        displayDate: formatDate(dateString),
        meals: [],
        totals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }
      };
    }
    
    // Add meal to the day's collection
    groupedMeals[dateString].meals.push(meal);
    
    // Update day's nutritional totals
    groupedMeals[dateString].totals.calories += (parseInt(meal.calories) || 0);
    groupedMeals[dateString].totals.protein += getNutritionValue(meal, 'protein');
    groupedMeals[dateString].totals.carbs += getNutritionValue(meal, 'carbs');
    groupedMeals[dateString].totals.fat += getNutritionValue(meal, 'fat');
  });
  
  // Convert to array and sort by date (newest first)
  return Object.values(groupedMeals).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
};

const MealCalendar = ({ meals, onViewMeal, onDeleteMeal }) => {
  const groupedMealsByDate = groupMealsByDate(meals);
  
  return (
    <div className="meal-calendar">
      {groupedMealsByDate.length > 0 ? (
        <div className="date-groups">
          {groupedMealsByDate.map(dateGroup => (
            <div key={dateGroup.date} className="date-group">
              <div className="date-header">
                <h3>{dateGroup.displayDate}</h3>
                <div className="date-totals">
                  <span className="total-calories">{dateGroup.totals.calories} cal</span>
                  <span className="total-macros">
                    <span>P: {dateGroup.totals.protein.toFixed(1)}g</span> • 
                    <span>C: {dateGroup.totals.carbs.toFixed(1)}g</span> • 
                    <span>F: {dateGroup.totals.fat.toFixed(1)}g</span>
                  </span>
                </div>
              </div>
              
              <div className="date-meals">
                {dateGroup.meals.map(meal => (
                  <div key={meal._id} className="calendar-meal-card">
                    <div className="meal-info">
                      <h4>{meal.name}</h4>
                      <div className="meal-time">
                        {new Date(meal.time).toLocaleTimeString('en-US', {
                          hour: 'numeric', 
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="meal-calories">{meal.calories} calories</div>
                      <div className="meal-macros">
                        <span>P: {getNutritionValue(meal, 'protein').toFixed(1)}g</span> • 
                        <span>C: {getNutritionValue(meal, 'carbs').toFixed(1)}g</span> • 
                        <span>F: {getNutritionValue(meal, 'fat').toFixed(1)}g</span>
                      </div>
                    </div>
                    <div className="meal-actions">
                      <button className="btn btn-small" onClick={() => onViewMeal(meal)}>
                        View
                      </button>
                      <button className="btn btn-small btn-delete" onClick={() => onDeleteMeal(meal._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-meals-message">
          <p>No meals found for the selected period.</p>
          <Link to="/log-meal" className="btn btn-primary">Log a Meal</Link>
        </div>
      )}
    </div>
  );
};

export default MealCalendar;
