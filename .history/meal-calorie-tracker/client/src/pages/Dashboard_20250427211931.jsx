import { useState, useEffect, useContext, useCallback } from 'react'; // Import useCallback
import { Link, useLocation } from 'react-router-dom'; // Import useLocation
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';
import GoalSettings from '../components/GoalSettings'; // Import GoalSettings
import './Dashboard.css'; // Import CSS

// Register required ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const CircularProgress = ({ value, max, color, title, unit, size = 'medium', subtitle = null }) => {
  // Calculate percentage for the circle fill
  // Ensure max is not zero to avoid division by zero
  const safeMax = max > 0 ? max : 1;
  const percentage = Math.min(100, (value / safeMax) * 100);
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

const WeeklyCaloriesDisplay = ({ data }) => {
  if (!data.labels || !data.calories || data.labels.length === 0) {
    return <div className="no-data">No weekly data available</div>;
  }

  return (
    <div className="weekly-calories-container">
      {data.labels.map((day, index) => {
        const value = data.calories[index] || 0;
        const max = 2000; // This could be the user's daily goal
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
  const { user, updateUser, refreshUser } = useContext(AuthContext); // Get refreshUser directly
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [calorieData, setCalorieData] = useState({ consumed: 0, goal: 2000, remaining: 2000 });
  const [weeklyData, setWeeklyData] = useState({ labels: [], calories: [], proteins: [], carbs: [], fats: [] });
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [macroTargets, setMacroTargets] = useState({ carbs: 150, protein: 100, fat: 70 });
  // Add state for consumed macros
  const [consumedMacros, setConsumedMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [isGoalSettingsOpen, setIsGoalSettingsOpen] = useState(false); // State for modal
  const [refreshCounter, setRefreshCounter] = useState(0);
  const location = useLocation(); // Get location

  // Effect to update local goals when user context changes
  useEffect(() => {
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
  }, [user]); // Rerun only when user object changes

  // Main data loading effect
  useEffect(() => {
    let isMounted = true; // Flag to track mount status

    const loadDashboardData = async () => {
      // Only proceed if user data is available
      if (!user || !isMounted) {
        // If no user yet, set loading false if it wasn't already
        if (!user && isLoading) setIsLoading(false);
        return;
      }

      console.log("Dashboard: Starting data load sequence...");
      setIsLoading(true);
      setError('');

      try {
        const today = new Date().toISOString().split('T')[0];
        const cacheBuster = new Date().getTime();

        // --- Removed await refreshUser() call from here to break the loop ---

        // Fetch today's meals
        console.log("Dashboard: Fetching today's meals...");
        let meals = [];
        try {
          meals = await mealService.getUserMeals({
            date: today,
            _t: cacheBuster
          });
          if (!isMounted) return; // Check mount status after await
          console.log("Dashboard: Today's meals raw data:", meals);
        } catch (mealError) {
          if (!isMounted) return;
          console.error("Dashboard: Failed to fetch meals:", mealError);
          throw new Error(`Meal data loading failed: ${mealError.message}`);
        }

        // Process meals
        const mealArray = Array.isArray(meals) ? meals : [];
        const todayDate = new Date().toISOString().split('T')[0];
        const todaysMeals = mealArray.filter(meal => new Date(meal.time).toISOString().split('T')[0] === todayDate);
        const sortedMeals = [...todaysMeals].sort((a, b) => new Date(b.time) - new Date(a.time));

        if (!isMounted) return;
        setTodaysMeals(sortedMeals); // Update state with ONLY today's meals

        // Calculate today's consumed calories & update state
        const todayConsumedCalories = sortedMeals.reduce((total, meal) => total + (meal.calories || 0), 0);
        const currentCalorieGoal = user.calorieGoal || 2000; // Use user from effect closure

        // Calculate today's consumed macros
        const macrosConsumedToday = calculateMacros(sortedMeals); // Pass today's meals

        if (isMounted) {
          setCalorieData({
            consumed: todayConsumedCalories,
            goal: currentCalorieGoal,
            remaining: currentCalorieGoal - todayConsumedCalories
          });
          // Set the consumed macros state
          setConsumedMacros(macrosConsumedToday);
        }

        // Load weekly stats
        try {
          console.log("Dashboard: Fetching weekly stats...");
          const weekStats = await mealService.getWeeklyStats();
          if (!isMounted) return;
          console.log("Dashboard: Weekly stats:", weekStats);

          // Process weekly stats
          const defaultWeekStats = { labels: [], calories: [], proteins: [], carbs: [], fats: [] };
          if (isMounted) {
            setWeeklyData({
              labels: weekStats?.days || defaultWeekStats.labels,
              calories: weekStats?.calories || defaultWeekStats.calories,
              proteins: weekStats?.proteins || defaultWeekStats.proteins,
              carbs: weekStats?.carbs || defaultWeekStats.carbs,
              fats: weekStats?.fats || defaultWeekStats.fats
            });
          }
        } catch (weeklyError) {
          if (!isMounted) return;
          console.error("Dashboard: Failed to fetch weekly stats:", weeklyError);
          if (isMounted) {
            setWeeklyData({ labels: [], calories: [], proteins: [], carbs: [], fats: [] }); // Set empty data on error
          }
        }

        // Macro targets are set by the other useEffect based on `user`

      } catch (err) {
        if (isMounted) {
          console.error('Dashboard: Failed to load dashboard data:', err);
          setError(`Failed to load dashboard: ${err.message}. Please try refreshing.`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          console.log("Dashboard: Data load sequence finished.");
        } else {
          console.log("Dashboard: Data load aborted, component unmounted during process.");
        }
      }
    };

    // Check for refresh flag from URL *before* loading data
    const urlSearchParams = new URLSearchParams(location.search);
    if (urlSearchParams.has('refresh')) {
      console.log("Dashboard: Refresh parameter detected.");
      window.history.replaceState({}, document.title, location.pathname);
      // Trigger data reload via refreshCounter if needed, though effect runs on mount/user change anyway
      // setRefreshCounter(prev => prev + 1);
    }

    loadDashboardData();

    // Cleanup function
    return () => {
      isMounted = false;
      console.log("Dashboard: Component unmounting or dependencies changed.");
    };

  // Dependencies: Run when user object is available/changes or when refresh is triggered
  }, [user, refreshCounter, location.search]); // location.search needed for refresh param check

  // Manual refresh function - Use useCallback
  const refreshDashboard = useCallback(() => {
    console.log("Dashboard: Manual refresh triggered");
    // Increment counter to trigger the useEffect hook
    setRefreshCounter(prev => prev + 1);
  }, []); // No dependencies needed

  // Save Goal Settings - Use useCallback
  const handleGoalSettingsSave = useCallback(async (newGoals) => {
    console.log("Dashboard: Updating goals with:", newGoals);
    setError(''); // Clear previous errors
    try {
      await updateUser({ // Use updateUser from context
        calorieGoal: newGoals.calorieGoal,
        proteinGoal: newGoals.proteinGoal,
        carbsGoal: newGoals.carbsGoal,
        fatGoal: newGoals.fatGoal
      });
      // The 'user' useEffect will update local state based on the context change
      setIsGoalSettingsOpen(false);
    } catch (err) {
      console.error("Dashboard: Error updating goals:", err);
      setError("Failed to update goals. Please try again.");
      // Optionally keep modal open on error: setIsGoalSettingsOpen(true);
    }
  }, [updateUser]); // Dependency on updateUser from context

  // Calculate macros from a given list of meals (used in useEffect)
  const calculateMacros = (mealsList) => {
    return mealsList.reduce((totals, meal) => {
      totals.protein += extractNutritionValue(meal, 'protein');
      totals.carbs += extractNutritionValue(meal, 'carbs');
      totals.fat += extractNutritionValue(meal, 'fat');
      return totals;
    }, { protein: 0, carbs: 0, fat: 0 });
  };

  // Extract nutrition value from meal object
  const extractNutritionValue = (meal, nutrient) => {
    return meal.nutrition && typeof meal.nutrition[nutrient] === 'number' ? meal.nutrition[nutrient] : 0;
  };

  // Format date for display
  const formatMealTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString);
        return "Invalid date";
      }
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Error";
    }
  };

  // Format date for display with date and time
  const formatMealDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      
      return date.toLocaleString([], { 
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
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
  if (isLoading && !user) { // Show loading only if user isn't loaded yet
     return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'User'}!</h1>
        <div>
          {/* Add button to open Goal Settings */}
          <button
            onClick={() => setIsGoalSettingsOpen(true)}
            className="btn btn-secondary"
            style={{ marginRight: '10px' }}
          >
            Set Goals
          </button>
          <button
            onClick={refreshDashboard}
            className="btn btn-secondary"
            style={{marginRight: '10px'}}
            disabled={isLoading} // Disable refresh button while loading
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <Link to="/log-meal" className="btn btn-primary">Log a Meal</Link>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          {/* Keep refresh button in header */}
        </div>
      )}

      {/* Calories Summary Section */}
      <div className="card macros-section">
        <h2>Calories</h2>
        <div className="calories-display">
          <CircularProgress 
            value={calorieData.consumed} 
            max={calorieData.goal} 
            color="#FF9800" 
            title="Today's Calories" 
            unit="cal"
            size="large"
            subtitle={`Goal: ${calorieData.goal} cal`}
          />
        </div>
      </div>

      {/* Weekly Calories Section */}
      <div className="card weekly-section">
        <h2>Weekly Overview</h2>
        <WeeklyCaloriesDisplay data={weeklyData} />
      </div>

      {/* Macros section */}
      <div className="card macros-section">
        <h2>Macros</h2>
        <div className="macros-gauges">
          {/* Display CONSUMED carbs vs TARGET carbs */}
          <CircularProgress
            value={consumedMacros.carbs}
            max={macroTargets.carbs}
            color="#4CAF50"
            title="Carbs"
            unit="g"
            subtitle={`Goal: ${macroTargets.carbs}g`}
          />
          {/* Display CONSUMED fat vs TARGET fat */}
          <CircularProgress
            value={consumedMacros.fat}
            max={macroTargets.fat}
            color="#9C27B0"
            title="Fat"
            unit="g"
            subtitle={`Goal: ${macroTargets.fat}g`}
          />
          {/* Display CONSUMED protein vs TARGET protein */}
          <CircularProgress
            value={consumedMacros.protein}
            max={macroTargets.protein}
            color="#2196F3"
            title="Protein"
            unit="g"
            subtitle={`Goal: ${macroTargets.protein}g`}
          />
        </div>
      </div>

      {/* Today's Meals - UPDATED */}
      <div className="card recent-meals">
        <h2>Today's Meals</h2>
        {todaysMeals.length > 0 ? (
          <div className="meals-grid">
            {todaysMeals.map(meal => (
              <div key={meal._id} className="meal-card" onClick={() => handleMealClick(meal)}>
                <div className="meal-card-header">
                  <h3 className="meal-name">{meal.name}</h3>
                  <span className="meal-time">{formatMealTime(meal.time)}</span>
                </div>
                <div className="meal-card-body">
                  <div className="meal-calories">{Math.round(meal.calories || 0)} cal</div>
                  <div className="meal-macros-summary">
                    <span>P: {extractNutritionValue(meal, 'protein').toFixed(1)}g</span>
                    <span>C: {extractNutritionValue(meal, 'carbs').toFixed(1)}g</span>
                    <span>F: {extractNutritionValue(meal, 'fat').toFixed(1)}g</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-meals">No meals logged today. <Link to="/log-meal">Add a meal</Link>.</p>
        )}
      </div>

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <MealDetailModal 
          meal={{
            ...selectedMeal,
            formattedTime: formatMealDateTime(selectedMeal.time)
          }} 
          onClose={handleCloseModal} 
        />
      )}

      {/* Goal Settings Modal */}
      <GoalSettings
        isOpen={isGoalSettingsOpen}
        onClose={() => setIsGoalSettingsOpen(false)}
        onSave={handleGoalSettingsSave}
        initialGoals={{ // Pass current user goals as initial values
          calorieGoal: user?.calorieGoal ?? 2000,
          proteinGoal: user?.proteinGoal ?? 100,
          carbsGoal: user?.carbsGoal ?? 150,
          fatGoal: user?.fatGoal ?? 70
        }}
      />
    </div>
  );
};

export default Dashboard;