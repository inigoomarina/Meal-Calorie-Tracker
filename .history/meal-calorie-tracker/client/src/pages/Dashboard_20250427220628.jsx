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
  
  // State for selected meal modal
  const [selectedMeal, setSelectedMeal] = useState(null);
  
  // State for goal settings modal
  const [isGoalSettingsOpen, setIsGoalSettingsOpen] = useState(false);
  
  // Add a refresh counter to force data reload
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError('');

      try {
        console.log("Loading dashboard data...");
        const today = new Date().toISOString().split('T')[0];
        const cacheBuster = new Date().getTime();

        // --- Fetch Today's Meals ---
        let meals = [];
        try {
          console.log("Fetching today's meals...");
          meals = await mealService.getUserMeals({
            date: today, // Explicitly fetch only for today
            _t: cacheBuster
          });
          console.log("Today's meals raw data:", meals);
        } catch (mealError) {
          console.error("Failed to fetch meals:", mealError);
          // Don't throw, allow partial load if possible
          setError(`Meal data loading failed: ${mealError.message}`);
        }

        // --- Process Today's Meals ---
        const mealArray = Array.isArray(meals) ? meals : [];
        const processedMeals = mealArray.map((meal, index) => {
          try {
            const mealDate = new Date(meal.date || meal.time || meal.createdAt);
            const mealDateStr = mealDate.toISOString().split('T')[0];

            // Strict check: Only include meals with today's date
            if (mealDateStr !== today) {
              console.warn(`Skipping meal from ${mealDateStr}, not today:`, meal.name);
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
              time: meal.time || meal.createdAt || new Date().toISOString(),
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

        const sortedMeals = [...processedMeals].sort((a, b) => new Date(b.time) - new Date(a.time));
        setTodaysMeals(sortedMeals);

        // --- Calculate Today's Totals ---
        const todayTotals = processedMeals.reduce((acc, meal) => {
          acc.calories += meal.calories || 0;
          acc.protein += meal.protein || 0;
          acc.carbs += meal.carbs || 0;
          acc.fat += meal.fat || 0;
          return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

        console.log("Today's totals calculated directly:", todayTotals);

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
          // Find today's index (assuming the API returns the last 7 days ending today)
          const todayIndex = weekStatsData.days.length - 1;
          if (todayIndex >= 0) {
             console.log(`Updating weekly stats for today (index ${todayIndex}) with calculated totals.`);
             weekStatsData.calories[todayIndex] = todayTotals.calories;
             weekStatsData.proteins[todayIndex] = todayTotals.protein;
             weekStatsData.carbs[todayIndex] = todayTotals.carbs;
             weekStatsData.fats[todayIndex] = todayTotals.fat;
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
          // Set empty/default weekly data on error
          setWeeklyData({ labels: [], calories: [], proteins: [], carbs: [], fats: [] });
        }

        // --- Set Macro Targets ---
        setMacroTargets({
          carbs: user?.carbsGoal || 150,
          protein: user?.proteinGoal || 100,
          fat: user?.fatGoal || 70
        });

      } catch (err) {
        // Catch any unexpected errors during the process
        console.error('Unexpected error loading dashboard data:', err);
        setError(`An unexpected error occurred: ${err.message}. Please try refreshing.`);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user, refreshCounter]); // Depend on user and refreshCounter

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
    
    // Try to get the value from different possible locations
    const directValue = meal[nutrient];
    const nestedValue = meal.nutrition && meal.nutrition[nutrient];
    
    // Return the first defined value or default to 0
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