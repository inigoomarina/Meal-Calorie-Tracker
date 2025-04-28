import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext.jsx';
import './MealCalendar.css'; // Ensure CSS is imported

// Helper function to get date string in YYYY-MM-DD format based on local timezone
const getLocalDateString = (dateInput) => {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date input");
    }
    // Use local year, month, day
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date:", error, dateInput);
    return null; // Return null for invalid dates
  }
};


const MealCalendar = ({ meals, onDeleteMeal }) => {
  const { user } = useContext(AuthContext);
  
  // Group meals by date using local date string
  const getMealsByDate = () => {
    const mealsByDate = {};
    
    meals.forEach(meal => {
      // Use the 'time' field if available, otherwise fallback to 'createdAt' or 'date'
      const dateStringToUse = meal.time || meal.createdAt || meal.date;
      if (!dateStringToUse) {
        console.warn("Meal missing timestamp:", meal);
        return; // Skip meal if no valid timestamp field
      }

      const localDateStr = getLocalDateString(dateStringToUse);
      
      if (localDateStr) { // Only process if date is valid
        if (!mealsByDate[localDateStr]) {
          mealsByDate[localDateStr] = {
            meals: [],
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          };
        }
        
        // Ensure nutrition values are numbers
        const mealCalories = Number(meal.calories) || 0;
        const mealProtein = Number(meal.nutrition?.protein || meal.protein || 0);
        const mealCarbs = Number(meal.nutrition?.carbs || meal.carbs || 0);
        const mealFat = Number(meal.nutrition?.fat || meal.fat || 0);

        mealsByDate[localDateStr].meals.push(meal);
        mealsByDate[localDateStr].calories += mealCalories;
        mealsByDate[localDateStr].protein += mealProtein;
        mealsByDate[localDateStr].carbs += mealCarbs;
        mealsByDate[localDateStr].fat += mealFat;
      }
    });
    
    // Sort meals within each day by time (descending - newest first)
    Object.keys(mealsByDate).forEach(date => {
      mealsByDate[date].meals.sort((a, b) => {
         const timeA = new Date(a.time || a.createdAt || a.date).getTime();
         const timeB = new Date(b.time || b.createdAt || b.date).getTime();
         return timeB - timeA; // Descending order
      });
    });

    return mealsByDate;
  };
  
  // Format date for display (e.g., "Mon, Sep 16")
  const formatDateForDisplay = (dateString) => {
    // Add time part to ensure correct date parsing in local timezone
    const date = new Date(`${dateString}T00:00:00`); 
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  const mealsByDate = getMealsByDate();
  // Sort the date keys themselves (most recent date first)
  const dateKeys = Object.keys(mealsByDate).sort((a, b) => new Date(b) - new Date(a));
  
  if (dateKeys.length === 0) {
    return <div className="no-meals-message">No meals found in the selected period.</div>;
  }
  
  return (
    <div className="meal-calendar">
      {dateKeys.map(date => {
        const dayData = mealsByDate[date];
        const calorieGoal = user?.calorieGoal || 2000;
        const isOverLimit = dayData.calories > calorieGoal;
        
        return (
          <div key={date} className="calendar-day-card">
            <div className="calendar-date">
              {/* Use the display formatter */}
              <h3>{formatDateForDisplay(date)}</h3> 
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
              <h4>Meals ({dayData.meals.length})</h4>
              {dayData.meals.length > 0 ? (
                <ul>
                  {dayData.meals.map(meal => (
                    <li key={meal._id || Math.random()} className="meal-item">
                      <div className="meal-info">
                        <div className="meal-name">{meal.name}</div>
                        <div className="meal-calories">{Number(meal.calories) || 0} cal</div>
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
                <p className="no-meals-for-day">No meals logged this day.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MealCalendar;
