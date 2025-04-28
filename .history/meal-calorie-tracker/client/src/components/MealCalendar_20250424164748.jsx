import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import './MealCalendar.css';

const MealCalendar = ({ meals, onDeleteMeal }) => {
  const { user } = useContext(AuthContext);
  
  // Group meals by date
  const getMealsByDate = () => {
    const mealsByDate = {};
    
    meals.forEach(meal => {
      const date = new Date(meal.time).toISOString().split('T')[0];
      
      if (!mealsByDate[date]) {
        mealsByDate[date] = {
          meals: [],
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        };
      }
      
      mealsByDate[date].meals.push(meal);
      mealsByDate[date].calories += meal.calories || 0;
      mealsByDate[date].protein += parseFloat(meal.nutrition?.protein || meal.protein || 0);
      mealsByDate[date].carbs += parseFloat(meal.nutrition?.carbs || meal.carbs || 0);
      mealsByDate[date].fat += parseFloat(meal.nutrition?.fat || meal.fat || 0);
    });
    
    return mealsByDate;
  };
  
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const mealsByDate = getMealsByDate();
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
              <h3>{formatDate(date)}</h3>
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
              <ul>
                {dayData.meals.map(meal => (
                  <li key={meal._id} className="meal-item">
                    <div className="meal-info">
                      <div className="meal-name">{meal.name}</div>
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
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MealCalendar;
