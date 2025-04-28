import React from 'react';
import './MealCalendar.css'; // Create this CSS file for styling

const MealCalendar = ({ meals = [], onDeleteMeal, calorieGoal = 2000 }) => {

  // Group meals by date (YYYY-MM-DD)
  const mealsByDate = meals.reduce((acc, meal) => {
    try {
      // Ensure meal.date or meal.time is a valid date string
      const mealDateStr = meal.date || meal.time; 
      if (!mealDateStr) {
        console.warn("Meal missing date:", meal);
        return acc;
      }
      const date = new Date(mealDateStr);
      // Format date as YYYY-MM-DD
      const dateKey = date.toISOString().split('T')[0]; 
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(meal);
    } catch (e) {
      console.error("Error processing meal date:", meal, e);
    }
    return acc;
  }, {});

  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(mealsByDate).sort((a, b) => b.localeCompare(a));

  if (sortedDates.length === 0) {
    return <p>No meal history found for the selected period.</p>;
  }

  return (
    <div className="meal-calendar">
      {sortedDates.map(dateKey => {
        const dailyMeals = mealsByDate[dateKey];
        const totalCalories = dailyMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        const difference = totalCalories - calorieGoal;
        const overUnderMessage = difference > 0 
          ? `You were ${difference} calories over your goal.`
          : `You were ${Math.abs(difference)} calories under your goal.`;
        const isOver = difference > 0;

        // Format date for display (e.g., "April 28")
        const displayDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric' 
        });

        return (
          <div key={dateKey} className={`calendar-day-card ${isOver ? 'over-goal' : 'under-goal'}`}>
            <div className="day-card-header">
              <h3>{displayDate}</h3>
              <span className="day-total-calories">Total: {totalCalories} kcal</span>
            </div>
            <p className="day-goal-message">{overUnderMessage}</p>
            {/* Optional: Add details toggle or list meals */}
            <div className="day-meals-list">
              <h4>Meals:</h4>
              {dailyMeals.length > 0 ? (
                <ul>
                  {dailyMeals.map(meal => (
                    <li key={meal._id}>
                      {meal.name} ({meal.calories} kcal)
                      <button 
                        onClick={() => onDeleteMeal(meal._id)} 
                        className="btn-delete-meal"
                        title="Delete Meal"
                      >
                        &times; {/* Simple delete icon */}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No meals logged for this day.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MealCalendar;
