import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext.jsx';
import './MealCalendar.css';

const MealCalendar = ({ meals, onDeleteMeal }) => {
  const { user } = useContext(AuthContext);
  
  // Group meals by date with proper date validation and timezone handling
  const getMealsByDate = () => {
    const mealsByDate = {};
    
    meals.forEach(meal => {
      try {
        // Use meal.time or meal.date, default to createdAt if necessary
        const dateSource = meal.time || meal.date || meal.createdAt;
        if (!dateSource) {
          console.warn("Meal missing valid date source:", meal);
          return; // Skip meal if no date source
        }

        // Create a Date object. ISO strings are usually UTC.
        const mealDateTime = new Date(dateSource);
        if (isNaN(mealDateTime.getTime())) {
          console.warn("Invalid date found in meal:", meal, "Date source:", dateSource);
          return; // Skip this meal if date is invalid
        }
        
        // Get date part in local timezone YYYY-MM-DD format
        // Adjust for potential timezone offset if needed, but usually grouping by UTC date is sufficient
        const year = mealDateTime.getFullYear();
        const month = (mealDateTime.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
        const day = mealDateTime.getDate().toString().padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        
        if (!mealsByDate[date]) {
          mealsByDate[date] = {
            meals: [],
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          };
        }
        
        // Ensure calories and nutrients are numbers
        const calories = parseInt(meal.calories) || 0;
        const protein = parseFloat(meal.nutrition?.protein || meal.protein || 0);
        const carbs = parseFloat(meal.nutrition?.carbs || meal.carbs || 0);
        const fat = parseFloat(meal.nutrition?.fat || meal.fat || 0);

        mealsByDate[date].meals.push(meal);
        mealsByDate[date].calories += calories;
        mealsByDate[date].protein += protein;
        mealsByDate[date].carbs += carbs;
        mealsByDate[date].fat += fat;
      } catch (error) {
        console.error("Error processing meal for calendar:", error, meal);
      }
    });
    
    return mealsByDate;
  };
  
  // Format date string (YYYY-MM-DD) for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    // Create date object interpreting the string as local date
    const dateParts = dateString.split('-');
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); 
    return date.toLocaleDateString('en-US', options);
  };
  
  const mealsByDate = getMealsByDate();
  // Sort dates: newest first
  const dateKeys = Object.keys(mealsByDate).sort((a, b) => b.localeCompare(a));
  
  if (dateKeys.length === 0) {
    return <div className="no-meals-message">No meals found in the selected period.</div>;
  }
  
  return (
    <div className="meal-calendar">
      {dateKeys.map(date => {
        const dayData = mealsByDate[date];
        const calorieGoal = user?.calorieGoal || 2000;
        const isOverLimit = dayData.calories > calorieGoal;
        
        // Sort meals within the day by time (newest first)
        const sortedMeals = dayData.meals.sort((a, b) => {
           const timeA = new Date(a.time || a.date || a.createdAt).getTime();
           const timeB = new Date(b.time || b.date || b.createdAt).getTime();
           return timeB - timeA; 
        });

        return (
          <div key={date} className="calendar-day-card">
            <div className="calendar-date">
              {/* Format the YYYY-MM-DD string */}
              <h3>{formatDate(date)}</h3> 
            </div>
            
            {/* ... existing summary code ... */}
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
              {sortedMeals.length > 0 ? (
                <ul>
                  {sortedMeals.map(meal => (
                    <li key={meal._id} className="meal-item">
                      <div className="meal-info">
                        <span className="meal-name">{meal.name}</span>
                        <span className="meal-calories">{meal.calories || 0} cal</span>
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
