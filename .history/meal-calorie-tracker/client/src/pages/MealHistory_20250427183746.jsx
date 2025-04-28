import { useState, useEffect, useContext } from 'react';
import mealService from '../services/mealService';
import { AuthContext } from '../context/AuthContext.jsx';
import { format, parseISO, startOfDay } from 'date-fns'; // Using date-fns for robust date handling

// Modal component for daily meal details
const MealDayDetailModal = ({ date, meals, dailyTotal, goal, onClose }) => {
  if (!meals) return null;

  const totalMacros = meals.reduce((acc, meal) => {
    acc.protein += parseFloat(meal.protein || meal.nutrition?.protein || 0);
    acc.carbs += parseFloat(meal.carbs || meal.nutrition?.carbs || 0);
    acc.fat += parseFloat(meal.fat || meal.nutrition?.fat || 0);
    return acc;
  }, { protein: 0, carbs: 0, fat: 0 });

  return (
    <div className="meal-modal-overlay" onClick={onClose}>
      <div className="meal-modal-content meal-history-modal" onClick={e => e.stopPropagation()}>
        <div className="meal-modal-header">
          <h3>Details for {format(parseISO(date), 'MMMM d, yyyy')}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="meal-modal-body">
          <h4>Total Intake: {dailyTotal} / {goal} cal</h4>
          <p>Macros: 
            Protein: {totalMacros.protein.toFixed(1)}g, 
            Carbs: {totalMacros.carbs.toFixed(1)}g, 
            Fat: {totalMacros.fat.toFixed(1)}g
          </p>
          <h5>Meals Logged:</h5>
          <ul className="meal-list-modal">
            {meals.map(meal => (
              <li key={meal._id}>
                <strong>{meal.name}</strong> ({meal.calories} cal) - 
                <small>{format(parseISO(meal.time || meal.createdAt), 'h:mm a')}</small> <br />
                <small>
                  P: {parseFloat(meal.protein || meal.nutrition?.protein || 0).toFixed(1)}g, 
                  C: {parseFloat(meal.carbs || meal.nutrition?.carbs || 0).toFixed(1)}g, 
                  F: {parseFloat(meal.fat || meal.nutrition?.fat || 0).toFixed(1)}g
                </small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Card component for each day in the history grid
const MealDayCard = ({ date, meals, dailyTotal, goal, onOpenDetails }) => {
  const isOverGoal = dailyTotal > goal;
  const goalStatus = isOverGoal ? 'Over Goal' : 'Under Goal';
  const statusClass = isOverGoal ? 'over-goal' : 'under-goal';

  return (
    <div className="meal-day-card card-animated">
      <h3>{format(parseISO(date), 'MMM d, yyyy')}</h3>
      <p className="daily-calories">{dailyTotal} <span className="cal-unit">cal</span></p>
      <p className={`goal-status ${statusClass}`}>
        {goalStatus} (Goal: {goal} cal)
      </p>
      <button onClick={onOpenDetails} className="btn btn-secondary btn-small">
        View Details
      </button>
    </div>
  );
};

const MealHistory = () => {
  const { user } = useContext(AuthContext);
  const [groupedMeals, setGroupedMeals] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDayData, setSelectedDayData] = useState(null); // For modal

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Fetch last 30 days by default, adjust as needed
        const historyData = await mealService.getMealHistory(); 
        
        if (!Array.isArray(historyData)) {
          console.error("Expected an array from getMealHistory, received:", historyData);
          throw new Error("Invalid data format received from server.");
        }

        // Group meals by date on the client-side
        const grouped = historyData.reduce((acc, meal) => {
          try {
            // Ensure valid date string before parsing
            const dateStr = meal.time || meal.date || meal.createdAt;
            if (!dateStr) {
              console.warn("Meal missing date/time:", meal);
              return acc;
            }
            
            const mealDate = startOfDay(parseISO(dateStr)).toISOString(); // Group by day start
            
            if (!acc[mealDate]) {
              acc[mealDate] = { meals: [], totalCalories: 0 };
            }
            
            // Ensure calories are numbers
            const calories = parseInt(meal.calories || 0, 10);
            if (isNaN(calories)) {
              console.warn("Invalid calorie value for meal:", meal);
            } else {
              acc[mealDate].meals.push(meal);
              acc[mealDate].totalCalories += calories;
            }
            
          } catch (e) {
            console.error("Error processing meal date:", meal, e);
          }
          return acc;
        }, {});

        // Sort dates newest first
        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
        const sortedGroupedMeals = {};
        sortedDates.forEach(date => {
          sortedGroupedMeals[date] = grouped[date];
          // Sort meals within each day by time
          sortedGroupedMeals[date].meals.sort((a, b) => 
            new Date(b.time || b.createdAt) - new Date(a.time || a.createdAt)
          );
        });

        setGroupedMeals(sortedGroupedMeals);
      } catch (err) {
        console.error('Error loading meal history:', err);
        setError('Failed to load meal history. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const handleOpenDetails = (date) => {
    setSelectedDayData({ date, ...groupedMeals[date] });
  };

  const handleCloseModal = () => {
    setSelectedDayData(null);
  };

  if (isLoading) {
    return <div className="loading">Loading meal history...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="meal-history-container">
      <h1>Meal History</h1>
      
      {Object.keys(groupedMeals).length === 0 ? (
        <p>No meal history found.</p>
      ) : (
        <div className="meal-history-grid">
          {Object.entries(groupedMeals).map(([date, data]) => (
            <MealDayCard
              key={date}
              date={date}
              meals={data.meals}
              dailyTotal={data.totalCalories}
              goal={user?.calorieGoal || 2000}
              onOpenDetails={() => handleOpenDetails(date)}
            />
          ))}
        </div>
      )}

      {selectedDayData && (
        <MealDayDetailModal
          date={selectedDayData.date}
          meals={selectedDayData.meals}
          dailyTotal={selectedDayData.totalCalories}
          goal={user?.calorieGoal || 2000}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default MealHistory;