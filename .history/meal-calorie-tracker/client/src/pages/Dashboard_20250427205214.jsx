import { useState, useEffect, useContext, useCallback } from 'react'; // Import useCallback
import { Link, useLocation } from 'react-router-dom'; 
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';
import GoalSettings from '../components/GoalSettings';
import './Dashboard.css'; // Ensure Dashboard CSS is imported

// Register required ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const CircularProgress = ({ value, max, color, title, unit, size = 'medium', subtitle = null }) => {
  // Ensure max is a positive number to avoid division by zero or negative values
  const validMax = Math.max(1, max || 1); // Use 1 as a minimum fallback
  // Calculate percentage for the circle fill
  const percentage = Math.min(100, (value / validMax) * 100);
  const rotation = percentage / 100 * 360;
  const remaining = Math.max(0, validMax - value);

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

const WeeklyCaloriesDisplay = ({ data }) => {
  if (!data.labels || !data.calories || data.labels.length === 0) {
    return <div className="no-data">No weekly data available</div>;
  }

  // Get the calorie goal from context to use for weekly visualization
  const { user } = useContext(AuthContext);
  // Use user's goal from context, provide a sensible default if not set
  const calorieGoal = user?.calorieGoal || 2000; 
  
  return (
    <div className="weekly-calories-container">
      {data.labels.map((day, index) => {
        const value = data.calories[index] || 0;
        // Use the calorieGoal from context for comparison
        const max = calorieGoal; 
        const percentage = Math.min(100, (value / Math.max(1, max)) * 100); // Avoid division by zero
        
        return (
          <div key={day} className="day-calories">
            <div className="day-label">{day}</div>
            <div className="day-progress-container">
              <div 
                className="day-progress-bar" 
                style={{ 
                  height: `${percentage}%`,
                  // Use calorieGoal for color logic
                  backgroundColor: value > calorieGoal ? '#ff4d4d' : '#4caf50' 
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
  const { user, updateUser, refreshUser } = useContext(AuthContext); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [calorieData, setCalorieData] = useState({ consumed: 0, goal: 2000, remaining: 2000 });
  const [weeklyData, setWeeklyData] = useState({ labels: [], calories: [], proteins: [], carbs: [], fats: [] });
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [macroTargets, setMacroTargets] = useState({ carbs: 150, protein: 100, fat: 70 });
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [isGoalSettingsOpen, setIsGoalSettingsOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const location = useLocation(); 

  // Memoize refreshUser to prevent unnecessary effect runs if context provides a stable function
  const stableRefreshUser = useCallback(() => {
    if (refreshUser) {
      return refreshUser();
    }
    return Promise.resolve(); // Return resolved promise if refreshUser is not available
  }, [refreshUser]);

  useEffect(() => {
    // Update goals from user context when user loads or changes
    if (user) {
      const userCalorieGoal = user.calorieGoal || 2000;
      // Update calorie goal and remaining, preserving consumed unless data is reloaded
      setCalorieData(prev => ({
        ...prev, // Keep existing consumed value until data reloads
        goal: userCalorieGoal,
        remaining: userCalorieGoal - prev.consumed 
      }));
      setMacroTargets({
        carbs: user.carbsGoal || 150,
        protein: user.proteinGoal || 100,
        fat: user.fatGoal || 70
      });
    }
  }, [user]); // Rerun when user object changes

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const loadDashboardData = async () => {
      if (!isMounted) return; // Exit if component unmounted
      
      console.log("Dashboard: Starting data load sequence...");
      setIsLoading(true);
      setError(''); // Clear previous errors on new load attempt
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const cacheBuster = new Date().getTime();
        
        // Ensure user data (including goals) is fresh before fetching meals
        console.log("Dashboard: Refreshing user data...");
        await stableRefreshUser(); 
        // Re-check mount status after await
        if (!isMounted) return; 

        // Fetch today's meals
        console.log("Dashboard: Fetching today's meals...");
        const meals = await mealService.getUserMeals({ 
          date: today, 
          _t: cacheBuster 
        });
        if (!isMounted) return; 
        console.log("Dashboard: Today's meals raw data:", meals);

        // Process meals (filter for today, calculate nutrition)
        const mealArray = Array.isArray(meals) ? meals : [];
        const processedMeals = mealArray.map((meal, index) => {
          try {
            const mealDate = new Date(meal.date || meal.time || meal.createdAt);
            if (isNaN(mealDate.getTime())) {
              console.warn(`Invalid date for meal ${index}:`, meal); return null;
            }
            const mealDateStr = mealDate.toISOString().split('T')[0];
            if (mealDateStr !== today) {
              console.log(`Skipping meal from ${mealDateStr}, not today:`, meal.name); return null;
            }
            const nutritionData = {
              protein: parseFloat(meal.protein || meal.nutrition?.protein || 0),
              carbs: parseFloat(meal.carbs || meal.nutrition?.carbs || 0),
              fat: parseFloat(meal.fat || meal.nutrition?.fat || 0),
              fiber: parseFloat(meal.fiber || meal.nutrition?.fiber || 0),
              sugar: parseFloat(meal.sugar || meal.nutrition?.sugar || 0)
            };
            return { ...meal, time: meal.time || meal.createdAt || new Date().toISOString(), calories: parseInt(meal.calories) || 0, nutrition: nutritionData, protein: nutritionData.protein, carbs: nutritionData.carbs, fat: nutritionData.fat, fiber: nutritionData.fiber, sugar: nutritionData.sugar };
          } catch (mealProcessError) {
            console.error(`Error processing meal at index ${index}:`, mealProcessError); return null;
          }
        }).filter(meal => meal !== null);

        // Sort meals
        const sortedMeals = [...processedMeals].sort((a, b) => {
          try {
            const dateA = new Date(a.time); const dateB = new Date(b.time);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
            return dateB - dateA;
          } catch (err) { console.error("Error sorting meals:", err); return 0; }
        });
        
        // Calculate today's totals from processed meals
        const todayConsumedCalories = sortedMeals.reduce((total, meal) => total + (meal.calories || 0), 0);
        const todayProtein = sortedMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
        const todayCarbs = sortedMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
        const todayFat = sortedMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

        // Update state for today's meals and calories *after* calculations
        if (isMounted) {
          setTodaysMeals(sortedMeals);
          // Use the latest user goal from the refreshed user context if available
          const currentCalorieGoal = user?.calorieGoal || 2000; 
          setCalorieData({
            consumed: todayConsumedCalories,
            goal: currentCalorieGoal,
            remaining: currentCalorieGoal - todayConsumedCalories
          });
          // Update macro targets based on refreshed user data
          setMacroTargets({
            carbs: user?.carbsGoal || 150,
            protein: user?.proteinGoal || 100,
            fat: user?.fatGoal || 70
          });
        }

        // Fetch weekly stats
        console.log("Dashboard: Fetching weekly stats...");
        try {
          const weekStats = await mealService.getWeeklyStats();
          if (!isMounted) return; 
          console.log("Dashboard: Weekly stats raw data:", weekStats);

          if (weekStats && weekStats.days) {
            // Ensure today's data in weekly stats reflects the calculated totals
            const todayIndex = weekStats.days.length - 1; 
            if (todayIndex >= 0) {
              weekStats.calories[todayIndex] = todayConsumedCalories;
              weekStats.proteins[todayIndex] = todayProtein;
              weekStats.carbs[todayIndex] = todayCarbs;
              weekStats.fats[todayIndex] = todayFat;
            }
            if (isMounted) {
              setWeeklyData({
                labels: weekStats.days || [], calories: weekStats.calories || [],
                proteins: weekStats.proteins || [], carbs: weekStats.carbs || [], fats: weekStats.fats || []
              });
            }
          } else {
            throw new Error("Invalid weekly stats data structure");
          }
        } catch (weeklyError) {
          console.error("Dashboard: Failed to fetch or process weekly stats:", weeklyError);
          // Generate default weekly data if API fails or data is invalid
          const todayDate = new Date();
          const defaultLabels = Array.from({length: 7}, (_, i) => {
            const date = new Date(todayDate); date.setDate(date.getDate() - i);
            return date.toLocaleDateString('en-US', {weekday: 'short'});
          }).reverse();
          const defaultData = Array(7).fill(0);
          const defaultWeekly = { labels: defaultLabels, calories: [...defaultData], proteins: [...defaultData], carbs: [...defaultData], fats: [...defaultData] };
          
          // Inject today's calculated data into the default structure
          defaultWeekly.calories[6] = todayConsumedCalories;
          defaultWeekly.proteins[6] = todayProtein;
          defaultWeekly.carbs[6] = todayCarbs;
          defaultWeekly.fats[6] = todayFat;
          
          if (isMounted) {
            setWeeklyData(defaultWeekly);
          }
        }

      } catch (err) {
        console.error('Dashboard: Failed to load dashboard data:', err);
        if (isMounted) {
          setError(`Failed to load dashboard: ${err.message}. Please try refreshing.`);
        }
      } finally {
        // Ensure loading is set to false even if errors occurred or component unmounted
        if (isMounted) {
          setIsLoading(false);
          console.log("Dashboard: Data load sequence finished.");
        } else {
          console.log("Dashboard: Data load aborted, component unmounted.");
        }
      }
    };

    // Check for refresh flag from URL *before* loading data
    const urlSearchParams = new URLSearchParams(location.search);
    if (urlSearchParams.has('refresh')) {
      console.log("Dashboard: Refresh parameter detected.");
      // Clear the URL parameter immediately to prevent re-triggering on subsequent renders
      window.history.replaceState({}, document.title, location.pathname); 
      // No need to manually trigger refreshCounter here, the effect will run anyway
    }

    loadDashboardData();

    // Cleanup function to set isMounted to false when the component unmounts
    return () => {
      isMounted = false;
      console.log("Dashboard: Component unmounting or dependencies changed.");
    };

  }, [user, refreshCounter, location.search, stableRefreshUser]); // Use stableRefreshUser

  // Manual refresh function
  const refreshDashboard = useCallback(() => {
    console.log("Dashboard: Manual refresh triggered");
    // Increment counter to trigger the useEffect hook
    setRefreshCounter(prev => prev + 1); 
  }, []); // No dependencies needed if it only increments state

  // Enhanced handleGoalSettingsSave with better state update propagation
  const handleGoalSettingsSave = async (newGoals) => {
    console.log("Updating goals with:", newGoals);
    try {
      // Call the updateUser function from AuthContext
      await updateUser({
        calorieGoal: newGoals.calorieGoal,
        proteinGoal: newGoals.proteinGoal,
        carbsGoal: newGoals.carbsGoal,
        fatGoal: newGoals.fatGoal
      });
      
      // Update local state immediately for responsiveness
      const updatedCalorieGoal = newGoals.calorieGoal || calorieData.goal;
      setCalorieData(prev => ({
        ...prev,
        goal: updatedCalorieGoal,
        remaining: updatedCalorieGoal - prev.consumed
      }));
      setMacroTargets({
        carbs: newGoals.carbsGoal || macroTargets.carbs,
        protein: newGoals.proteinGoal || macroTargets.protein,
        fat: newGoals.fatGoal || macroTargets.fat
      });
      
      setIsGoalSettingsOpen(false); // Close modal on successful save
    } catch (err) {
      console.error("Error updating goals:", err);
      setError("Failed to update goals. Please try again.");
      // Keep modal open on error
    }
  };

  // Calculate current macros ONLY from today's meals
  const currentMacros = {
    protein: todaysMeals.reduce((sum, meal) => sum + parseFloat(meal.protein || meal.nutrition?.protein || 0), 0),
    carbs: todaysMeals.reduce((sum, meal) => sum + parseFloat(meal.carbs || meal.nutrition?.carbs || 0), 0),
    fat: todaysMeals.reduce((sum, meal) => sum + parseFloat(meal.fat || meal.nutrition?.fat || 0), 0)
  };
  
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

  // Conditional rendering for loading state
  if (isLoading && !todaysMeals.length) { // Show loading only on initial load or full refresh
     // Avoid showing loading indicator if only goals are updating
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'User'}!</h1>
        <div className="dashboard-actions">
          <button onClick={() => setIsGoalSettingsOpen(true)} className="btn btn-secondary" title="Set your daily calorie and macro goals">Set Goals</button>
          <button onClick={refreshDashboard} className="btn btn-secondary" style={{marginRight: '10px', marginLeft: '10px'}} disabled={isLoading}> {/* Disable refresh if already loading */}
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <Link to="/log-meal" className="btn btn-primary">Log a Meal</Link>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={refreshDashboard} className="btn btn-small" style={{marginLeft: '10px'}} disabled={isLoading}>
            {isLoading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {/* Calories Summary Section with Circular Progress - Fixed display */}
      <div className="card macros-section">
        <h2>Calories</h2>
        <div className="calories-display">
          <CircularProgress 
            value={calorieData.consumed} 
            max={calorieData.goal} // Use state for max
            color="#FF9800" 
            title="Today's Calories" 
            unit="cal"
            size="large"
            subtitle={`Goal: ${calorieData.goal} cal`} // Use state for goal display
          />
        </div>
      </div>

      {/* Weekly Calories Section */}
      <div className="card weekly-section">
        <h2>Weekly Overview</h2>
        <WeeklyCaloriesDisplay data={weeklyData} />
      </div>

      {/* Macros section with circular progress gauges */}
      <div className="card macros-section">
        <h2>Macros</h2>
        <div className="macros-gauges">
          <CircularProgress 
            value={currentMacros.carbs} 
            max={macroTargets.carbs} // Use state for max
            color="#4CAF50" 
            title="Net Carbs" 
            unit="g"
          />
          <CircularProgress 
            value={currentMacros.fat} 
            max={macroTargets.fat} // Use state for max
            color="#9C27B0" 
            title="Fat" 
            unit="g"
          />
          <CircularProgress 
            value={currentMacros.protein} 
            max={macroTargets.protein} // Use state for max
            color="#2196F3" 
            title="Protein" 
            unit="g"
          />
        </div>
      </div>

      {/* Today's Meals as a grid of cards */}
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
        initialGoals={{
          calorieGoal: user?.calorieGoal || calorieData.goal,
          proteinGoal: user?.proteinGoal || macroTargets.protein,
          carbsGoal: user?.carbsGoal || macroTargets.carbs,
          fatGoal: user?.fatGoal || macroTargets.fat
        }}
      />
    </div>
  );
};

export default Dashboard;