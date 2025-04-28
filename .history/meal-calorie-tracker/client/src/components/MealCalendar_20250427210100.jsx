import { useMemo, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import './MealCalendar.css'; // Import CSS

// Helper function to format date as YYYY-MM-DD
const formatDateKey = (date) => {
  return date.toISOString().split('T')[0];
};

// Helper function to format date for display (e.g., "Mon, Apr 29")
const formatDisplayDate = (dateString) => {
  const date = new Date(dateString + 'T00:00:00'); // Ensure correct date parsing
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

// Helper function to format time (e.g., "08:30 AM")
const formatMealTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MealCalendar = ({ meals, onDeleteMeal, userGoal }) => {
  const { user } = useContext(AuthContext); // Get user context if needed for more details

  // Group meals by date and calculate daily totals
  const groupedMeals = useMemo(() => {
    const groups = {};

    // Sort meals by date first (descending) then time (ascending within day)
    const sortedMeals = [...meals].sort((a, b) => {
        const dateA = new Date(a.time).setHours(0,0,0,0);
        const dateB = new Date(b.time).setHours(0,0,0,0);
        if (dateB !== dateA) {
            return dateB - dateA; // Sort days descending
        }
        return new Date(a.time) - new Date(b.time); // Sort meals ascending within day
    });


    sortedMeals.forEach(meal => {
      const mealDate = new Date(meal.time);
      const dateKey = formatDateKey(mealDate);

      if (!groups[dateKey]) {
        groups[dateKey] = {
          meals: [],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
        };
      }

      groups[dateKey].meals.push(meal);
      groups[dateKey].totalCalories += meal.calories || 0;
      groups[dateKey].totalProtein += meal.nutrition?.protein || 0;
      groups[dateKey].totalCarbs += meal.nutrition?.carbs || 0;
      groups[dateKey].totalFat += meal.nutrition?.fat || 0;
    });

    return groups;
  }, [meals]);

  const dateKeys = Object.keys(groupedMeals); // Already sorted by descending date due to meal sort order

  if (dateKeys.length === 0) {
    return null; // Render nothing if no meals
  }

  return (
    <div className="meal-calendar">
      {dateKeys.map(dateKey => {
        const dayData = groupedMeals[dateKey];
        const calorieDiff = dayData.totalCalories - userGoal;
        const calorieStatus = calorieDiff > 0 ? 'over' : 'under';
        const calorieDiffText = calorieDiff > 0
          ? `${Math.round(calorieDiff)} cal over goal`
          : `${Math.round(Math.abs(calorieDiff))} cal under goal`;
        const isToday = dateKey === formatDateKey(new Date());

        return (
          <div key={dateKey} className={`day-card card ${isToday ? 'today' : ''}`}>
            <div className="day-header">
              <h2>{formatDisplayDate(dateKey)} {isToday && '(Today)'}</h2>
              <div className={`day-summary ${calorieStatus}`}>
                <span>Total: {Math.round(dayData.totalCalories)} cal</span>
                <span className="goal-comparison">({calorieDiffText})</span>
              </div>
            </div>
            <ul className="meal-list">
              {dayData.meals.map(meal => (
                <li key={meal._id} className="meal-item">
                  <div className="meal-info">
                    <span className="meal-time">{formatMealTime(meal.time)}</span>
                    <span className="meal-name">{meal.name}</span>
                  </div>
                  <div className="meal-nutrition">
                    <span className="meal-calories">{meal.calories} cal</span>
                    {/* Optional: Show macros */}
                    {/* <span className="meal-macros">
                      P:{Math.round(meal.nutrition?.protein || 0)}g |
                      C:{Math.round(meal.nutrition?.carbs || 0)}g |
                      F:{Math.round(meal.nutrition?.fat || 0)}g
                    </span> */}
                  </div>
                  <button
                    onClick={() => onDeleteMeal(meal._id)}
                    className="btn-delete-meal"
                    title="Delete Meal"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
            <div className="day-totals">
              <strong>Daily Totals:</strong>
              <span> P: {Math.round(dayData.totalProtein)}g</span> |
              <span> C: {Math.round(dayData.totalCarbs)}g</span> |
              <span> F: {Math.round(dayData.totalFat)}g</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MealCalendar;
