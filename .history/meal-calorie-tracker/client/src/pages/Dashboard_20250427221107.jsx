import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { AuthContext } from '@/context/AuthContext.jsx';
import mealService from '@/services/mealService';
import GoalSettings from '@/components/GoalSettings';

// Register required ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const CircularProgress = ({ value, max, color, title, unit, size = 'medium', subtitle = null }) => {
  // Calculate percentage for the circle fill
  const percentage = Math.min(100, (value / max) * 100);
  const rotation = percentage / 100 * 360;
  const remaining = Math.max(0, max - value);

  return (
    <div className={`circular-progress ${size}`}>
      <div className="circular-progress-title">{title}</div>
      <div className="circular-progress-container" style={{ '--rotation': `${rotation}deg`, '--color': color }}>
        <div className="circular-progress-value">{Math.round(value)}</div>
        <div className="circular-progress-unit">{unit}</div>
      </div>
      {subtitle ? (
        <div className="circular-progress-subtitle">{subtitle}</div>
      ) : (
        <div className="circular-progress-remaining">{Math.round(remaining)}{unit} left</div>
      )}
    </div>
  );
};

const WeeklyCaloriesDisplay = ({ data, calorieGoal }) => { // Accept calorieGoal as a prop
  if (!data.labels || !data.calories || data.labels.length === 0) {
    return <div className="no-data">No weekly data available</div>;
  }

  // Use the passed calorieGoal
  const goal = calorieGoal || 2000;

  return (
    <div className="weekly-calories-container">
      {data.labels.map((day, index) => {
        const value = data.calories[index] || 0;
        const max = goal; // Use the goal prop
        const percentage = Math.min(100, (value / max) * 100);

        return (
          <div key={day} className="day-calories">
            <div className="day-label">{day}</div>
            <div className="day-progress-container">
              <div
                className="day-progress-bar"
                style={{
                  height: `${percentage}%`,
                  backgroundColor: value > max ? '#ff4d4d' : '#4caf50'
                }}
              ></div>
            </div>
            <div className="day-value">{value}</div>
          </div>
        );
      })}
    </div>
  );
};

// Modal component for meal details
const MealDetailModal = ({ meal, onClose }) => {
  if (!meal) return null;
  
  return (
    <div className="meal-modal-overlay" onClick={onClose}>
      <div className="meal-modal-content" onClick={e => e.stopPropagation()}>
        <div className="meal-modal-header">
          <h3>{meal.name}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="meal-modal-body">
          <div className="meal-detail-item">
            <span className="label">Calories:</span>
            <span className="value">{meal.calories} cal</span>
          </div>
          <div className="meal-detail-item">
            <span className="label">Protein:</span>
            <span className="value">{meal.nutrition?.protein || 0}g</span>
          </div>
          <div className="meal-detail-item">
            <span className="label">Carbs:</span>
            <span className="value">{meal.nutrition?.carbs || 0}g</span>
          </div>
          <div className="meal-detail-item">
            <span className="label">Fat:</span>
            <span className="value">{meal.nutrition?.fat || 0}g</span>
          </div>
          <div className="meal-detail-item">
            <span className="label">Date & Time:</span>
            <span className="value">{meal.formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [calorieData, setCalorieData] = useState({
    consumed: 0,
    goal: 2000,
    remaining: 0
  });
  const [weeklyData, setWeeklyData] = useState({
    labels: [],
    calories: [],
    proteins: [],
    carbs: [],
    fats: []
  });
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [macroTargets, setMacroTargets] = useState({
    carbs: 150,
    protein: 100,
    fat: 70
  });
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [isGoalSettingsOpen, setIsGoalSettingsOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);


  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError('');

      try {
        console.log("Loading dashboard data...");
        // Get today's date string in UTC YYYY-MM-DD format
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = now.getUTCDate().toString().padStart(2, '0');
        const todayUTCString = `${year}-${month}-${day}`;
        const todayLocalString = now.toISOString().split('T')[0]; // Keep local for API call if needed

        const cacheBuster = new Date().getTime();

        // --- Fetch Today's Meals (using local date for API filter if backend expects it) ---
        let meals = [];
        try {
          console.log("Fetching today's meals using local date:", todayLocalString);
          meals = await mealService.getUserMeals({
            date: todayLocalString, // Use local date for API filter
            _t: cacheBuster
          });
          console.log("Today's meals raw data:", meals);
        } catch (mealError) {
          console.error("Failed to fetch meals:", mealError);
          setError(`Meal data loading failed: ${mealError.message}`);
        }

        // --- Process Today's Meals (using UTC date for filtering) ---
        const mealArray = Array.isArray(meals) ? meals : [];
        const processedMeals = mealArray.map((meal, index) => {
          try {
            // Prioritize 'time' field
            const mealTimestamp = meal.time || meal.createdAt || meal.date;
            if (!mealTimestamp) return null; // Skip if no timestamp

            const mealDateTime = new Date(mealTimestamp);
            if (isNaN(mealDateTime.getTime())) return null; // Skip if invalid date

            // Extract UTC date string (YYYY-MM-DD)
            const mealYear = mealDateTime.getUTCFullYear();
            const mealMonth = (mealDateTime.getUTCMonth() + 1).toString().padStart(2, '0');
            const mealDay = mealDateTime.getUTCDate().toString().padStart(2, '0');
            const mealDateUTCString = `${mealYear}-${mealMonth}-${mealDay}`;

            // Strict check: Only include meals with today's UTC date
            if (mealDateUTCString !== todayUTCString) {
              console.warn(`Skipping meal from UTC date ${mealDateUTCString}, not today (${todayUTCString}):`, meal.name);
              return null;
            }

            const nutritionData = {
              protein: parseFloat(meal.protein || meal.nutrition?.protein || 0),
              carbs: parseFloat(meal.carbs || meal.nutrition?.carbs || 0),
              fat: parseFloat(meal.fat || meal.nutrition?.fat || 0),
              fiber: parseFloat(meal.fiber || meal.nutrition?.fiber || 0),
              sugar: parseFloat(meal.sugar || meal.nutrition?.sugar || 0)
            };

            return {
              ...meal,
              time: mealTimestamp, // Use the determined timestamp
              calories: parseInt(meal.calories) || 0,
              nutrition: nutritionData,
              protein: nutritionData.protein,
              carbs: nutritionData.carbs,
              fat: nutritionData.fat,
              fiber: nutritionData.fiber,
              sugar: nutritionData.sugar
            };
          } catch (mealProcessError) {
            console.error(`Error processing meal at index ${index}:`, mealProcessError);
            return null;
          }
        }).filter(meal => meal !== null);

        // Sort by time descending
        const sortedMeals = [...processedMeals].sort((a, b) => {
             try {
                const timeA = a.time || a.createdAt || a.date;
                const timeB = b.time || b.createdAt || b.date;
                return new Date(timeB) - new Date(timeA);
             } catch { return 0; }
        });
        setTodaysMeals(sortedMeals);

        // --- Calculate Today's Totals (from the filtered processedMeals) ---
        const todayTotals = sortedMeals.reduce((acc, meal) => { // Use sortedMeals which are guaranteed to be from today (UTC)
          acc.calories += meal.calories || 0;
          acc.protein += meal.protein || 0;
          acc.carbs += meal.carbs || 0;
          acc.fat += meal.fat || 0;
          return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

        console.log("Today's totals calculated from UTC-filtered meals:", todayTotals);

        const currentCalorieGoal = user?.calorieGoal || 2000;
        setCalorieData({
          consumed: todayTotals.calories,
          goal: currentCalorieGoal,
          remaining: currentCalorieGoal - todayTotals.calories
        });

        // --- Fetch Weekly Stats ---
        let weekStatsData = null;
        try {
          console.log("Fetching weekly stats...");
          weekStatsData = await mealService.getWeeklyStats({ _t: cacheBuster }); // Add cache buster
          console.log("Weekly stats raw data:", weekStatsData);

          if (!weekStatsData || !weekStatsData.days || !weekStatsData.calories) {
             throw new Error("Invalid weekly stats data structure received");
          }

          // --- Correct Today's Data in Weekly Stats ---
          // Find today's index (assuming the API returns the last 7 days ending today, check based on UTC date string)
          const todayIndex = weekStatsData.days.findIndex(dayLabel => {
              // Assuming dayLabel is also YYYY-MM-DD from the backend
              return dayLabel === todayUTCString;
          });

          if (todayIndex !== -1) {
             console.log(`Updating weekly stats for today (index ${todayIndex}) with calculated totals.`);
             weekStatsData.calories[todayIndex] = todayTotals.calories;
             weekStatsData.proteins[todayIndex] = todayTotals.protein;
             weekStatsData.carbs[todayIndex] = todayTotals.carbs;
             weekStatsData.fats[todayIndex] = todayTotals.fat;
          } else {
             console.warn("Could not find today's date in weekly stats labels to update totals.");
          }


          setWeeklyData({
            labels: weekStatsData.days || [],
            calories: weekStatsData.calories || [],
            proteins: weekStatsData.proteins || [],
            carbs: weekStatsData.carbs || [],
            fats: weekStatsData.fats || []
          });

        } catch (weeklyError) {
          console.error("Failed to fetch or process weekly stats:", weeklyError);
          setError(prev => prev ? `${prev}\nWeekly stats loading failed: ${weeklyError.message}` : `Weekly stats loading failed: ${weeklyError.message}`);
          setWeeklyData({ labels: [], calories: [], proteins: [], carbs: [], fats: [] });
        }

        // --- Set Macro Targets ---
        setMacroTargets({
          carbs: user?.carbsGoal || 150,
          protein: user?.proteinGoal || 100,
          fat: user?.fatGoal || 70
        });


      } catch (err) {
        console.error('Unexpected error loading dashboard data:', err);
        setError(`An unexpected error occurred: ${err.message}. Please try refreshing.`);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user, refreshCounter]);

  // Add the missing refreshDashboard function
  const refreshDashboard = () => {
    console.log("Manual dashboard refresh triggered");
    setIsLoading(true);
    setError('');
    setRefreshCounter(prev => prev + 1);
    
    // Add a small delay before refreshing to ensure state updates
    setTimeout(() => {
      if (error) {
        console.log("Clearing error state for refresh");
        setError('');
      }
    }, 100);
  };
  
  // Enhanced handleGoalSettingsSave with better state update propagation
  const handleGoalSettingsSave = async (newGoals) => {
    console.log("Updating goals with:", newGoals);
    
    try {
      // Update calorie data immediately for UI responsiveness
      setCalorieData(prev => ({
        ...prev,
        goal: newGoals.calorieGoal || prev.goal,
        remaining: (newGoals.calorieGoal || prev.goal) - prev.consumed
      }));
      
      // Update macro targets immediately for UI
      setMacroTargets({
        carbs: newGoals.carbsGoal || macroTargets.carbs,
        protein: newGoals.proteinGoal || macroTargets.protein,
        fat: newGoals.fatGoal || macroTargets.fat
      });
      
      // Force refresh dashboard data
      refreshDashboard();
    } catch (err) {
      console.error("Error updating goals:", err);
      setError("Failed to update goals. Please try again.");
    }
  };

  // Calculate current macros from the accurately filtered todaysMeals
  const currentMacros = todaysMeals.reduce((sum, meal) => {
      sum.protein += parseFloat(meal.protein || meal.nutrition?.protein || 0);
      sum.carbs += parseFloat(meal.carbs || meal.nutrition?.carbs || 0);
      sum.fat += parseFloat(meal.fat || meal.nutrition?.fat || 0);
      return sum;
  }, { protein: 0, carbs: 0, fat: 0 });

  // Helper function to extract nutrition values from meal objects
  const extractNutritionValue = (meal, nutrient) => {
    if (!meal) return 0;
    const directValue = meal[nutrient];
    const nestedValue = meal.nutrition && meal.nutrition[nutrient];
    return parseFloat(directValue || nestedValue || 0);
  };
  
  // Format meal date and time for display
  const formatMealDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      return date.toLocaleString('en-US', { 
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error("Error in formatMealDateTime:", error, dateString);
      return "Error";
    }
  };
  
  // Handle opening meal detail modal
  const handleMealClick = (meal) => {
    setSelectedMeal(meal);
  };
  
  // Handle closing meal detail modal
  const handleCloseModal = () => {
    setSelectedMeal(null);
  };

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'User'}!</h1>
        <div className="dashboard-actions">
          <button 
            onClick={() => setIsGoalSettingsOpen(true)} 
            className="btn btn-secondary"
            title="Set your daily calorie and macro goals"
          >
            Set Goals
          </button>
          <button 
            onClick={refreshDashboard} 
            className="btn btn-secondary" 
            style={{marginRight: '10px', marginLeft: '10px'}}
          >
            Refresh Data
          </button>
          <Link to="/log-meal" className="btn btn-primary">Log a Meal</Link>
        </div>
      </div>


      {error && (
        <div className="error-message">
          {/* Display multi-line errors if needed */}
          {error.split('\n').map((line, i) => <p key={i}>{line}</p>)}
          <button onClick={refreshDashboard} className="btn btn-small">Retry</button>
        </div>
      )}

      {/* Calories Summary Section with Circular Progress - Fixed display */}
      <div className="card macros-section">
        <h2>Calories</h2>
        <div className="calories-display">
          <CircularProgress 
            value={calorieData.consumed || 0} 
            max={calorieData.goal || 2000} 
            color="#FF9800" 
            title="Today's Calories" 
            unit="cal"
            size="large"
            subtitle={`Goal: ${calorieData.goal || 2000} cal`}
          />
        </div>
      </div>


      {/* Weekly Calories Section - Pass the correct calorie goal */}
      <div className="card weekly-section">
        <h2>Weekly Overview</h2>
        <WeeklyCaloriesDisplay data={weeklyData} calorieGoal={calorieData.goal} />
      </div>


      {/* Macros section - Uses calculated currentMacros */}
      <div className="card macros-section">
        <h2>Macros</h2>
        <div className="macros-gauges">
          <CircularProgress
            value={currentMacros.carbs}
            max={macroTargets.carbs}
            color="#4CAF50"
            title="Net Carbs"
            unit="g"
          />
          <CircularProgress
            value={currentMacros.fat}
            max={macroTargets.fat}
            color="#9C27B0"
            title="Fat"
            unit="g"
          />
          <CircularProgress
            value={currentMacros.protein}
            max={macroTargets.protein}
            color="#2196F3"
            title="Protein"
            unit="g"
          />
        </div>
      </div>


      {/* Today's Meals - Uses accurately filtered todaysMeals */}
      <div className="card recent-meals">
        <h2>Today's Meals</h2>
        {todaysMeals.length > 0 ? (
          <div className="meals-grid">
            {todaysMeals.map(meal => (
              <div key={meal._id || Math.random()} className="meal-card" onClick={() => handleMealClick(meal)}>
                <h3 className="meal-name">{meal.name || 'Unnamed meal'}</h3>
                <div className="meal-calories">{meal.calories || 0} calories</div>
                <div className="meal-time">
                  {formatMealDateTime(meal.time)}
                </div>
                <div className="meal-macros">
                  <span>P: {extractNutritionValue(meal, 'protein').toFixed(1)}g</span> • 
                  <span>C: {extractNutritionValue(meal, 'carbs').toFixed(1)}g</span> • 
                  <span>F: {extractNutritionValue(meal, 'fat').toFixed(1)}g</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-meals">No meals logged today. <Link to="/log-meal">Add a meal</Link>.</p>
        )}
      </div>


      {/* Meal Detail Modal with improved data handling */}
      {selectedMeal && (
        <MealDetailModal 
          meal={{
            ...selectedMeal,
            formattedTime: formatMealDateTime(selectedMeal.time),
            calories: selectedMeal.calories || 0,
            nutrition: {
              protein: parseFloat(extractNutritionValue(selectedMeal, 'protein')).toFixed(1),
              carbs: parseFloat(extractNutritionValue(selectedMeal, 'carbs')).toFixed(1),
              fat: parseFloat(extractNutritionValue(selectedMeal, 'fat')).toFixed(1),
              fiber: parseFloat(extractNutritionValue(selectedMeal, 'fiber')).toFixed(1),
              sugar: parseFloat(extractNutritionValue(selectedMeal, 'sugar')).toFixed(1)
            }
          }} 
          onClose={handleCloseModal} 
        />
      )}


      {/* Goal Settings Modal */}
      <GoalSettings 
        isOpen={isGoalSettingsOpen} 
        onClose={() => setIsGoalSettingsOpen(false)} 
        onSave={handleGoalSettingsSave} 
      />

    </div>
  );
};

export default Dashboard;