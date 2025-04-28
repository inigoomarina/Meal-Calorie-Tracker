import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext.jsx';
import './MealCalendar.css';

const MealCalendar = ({ meals, onDeleteMeal }) => {
  const { user } = useContext(AuthContext);

  // Group meals by date with stricter validation
  const getMealsByDate = () => {
    const mealsByDate = {};

    meals.forEach(meal => {
      try {
        // Validate the date before processing
        const mealDateTime = new Date(meal.time || meal.date || meal.createdAt); // Prefer 'time' if available
        if (isNaN(mealDateTime.getTime())) {
          console.warn("Invalid date found in meal:", meal);
          return; // Skip this meal if date is invalid
        }

        // Extract date part only (YYYY-MM-DD) in UTC to avoid timezone issues with grouping
        const dateKey = mealDateTime.toISOString().split('T')[0];

        if (!mealsByDate[dateKey]) {
          mealsByDate[dateKey] = {
            meals: [],
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          };
        }

        // Add meal to the correct date group
        mealsByDate[dateKey].meals.push(meal);
        mealsByDate[dateKey].calories += meal.calories || 0;
        mealsByDate[dateKey].protein += parseFloat(meal.protein || meal.nutrition?.protein || 0);
        mealsByDate[dateKey].carbs += parseFloat(meal.carbs || meal.nutrition?.carbs || 0);
        mealsByDate[dateKey].fat += parseFloat(meal.fat || meal.nutrition?.fat || 0);

      } catch (error) {
        console.error("Error processing meal for calendar:", error, meal);
      }
    });

    // Sort meals within each day by time (descending - most recent first)
    Object.values(mealsByDate).forEach(dayData => {
       dayData.meals.sort((a, b) => {
          try {
             return new Date(b.time || b.date || b.createdAt) - new Date(a.time || a.date || a.createdAt);
          } catch {
             return 0; // Fallback if dates are invalid
          }
       });
    });


    return mealsByDate;
  };

  const formatDate = (dateString) => {
    // Add timezone offset to display date in local time correctly
    const date = new Date(dateString + 'T00:00:00'); // Treat as local start of day
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatMealTime = (timeString) => {
     try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return "Invalid time";
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
     } catch {
        return "Time N/A";
     }
  };

  const mealsByDate = getMealsByDate();
  // Sort the date keys (YYYY-MM-DD strings) descending
  const dateKeys = Object.keys(mealsByDate).sort((a, b) => b.localeCompare(a));

  if (dateKeys.length === 0) {
    return <div className="no-meals-message">No meals found in the selected period.</div>;
  }

  return (
    <div className="meal-calendar">
      {dateKeys.map(dateKey => { // Use dateKey which is YYYY-MM-DD
        const dayData = mealsByDate[dateKey];
        const calorieGoal = user?.calorieGoal || 2000;
        const isOverLimit = dayData.calories > calorieGoal;

        return (
          <div key={dateKey} className="calendar-day-card">
            <div className="calendar-date">
              <h3>{formatDate(dateKey)}</h3> {/* Format the YYYY-MM-DD key */}
            </div>

            <div className={`calendar-summary ${isOverLimit ? 'over-limit' : 'under-limit'}`}>
              <div className="day-calories">
                <strong>{Math.round(dayData.calories)}</strong> calories
                <span className="goal-status">
                  {isOverLimit ? 
                    `(${Math.round(dayData.calories - calorieGoal)} over limit)` : 
                    `(${Math.round(calorieGoal - dayData.calories)} under limit)`}
                </span>
              </div>
              
              <div className="day-macros">
                <div className="macro-item"><span>Protein:</span> {dayData.protein.toFixed(1)}g</div>
                <div className="macro-item"><span>Carbs:</span> {dayData.carbs.toFixed(1)}g</div>
                <div className="macro-item"><span>Fat:</span> {dayData.fat.toFixed(1)}g</div>
              </div>
            </div>

            <div className="day-meals">
              <h4>Meals</h4>
              {dayData.meals.length > 0 ? (
                <ul>
                  {dayData.meals.map(meal => (
                    <li key={meal._id} className="meal-item">
                      <div className="meal-info">
                        <div className="meal-name">{meal.name}</div>
                        {/* Display meal time */}
                        <div className="meal-time-display">{formatMealTime(meal.time || meal.date || meal.createdAt)}</div>
                        <div className="meal-calories">{meal.calories} cal</div>
                      </div>
                      <button
                        className="btn btn-delete"
                        onClick={() => onDeleteMeal(meal._id)}
                        title="Delete this meal"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                 <p className="no-meals-for-day">No meals logged on this day.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MealCalendar;
