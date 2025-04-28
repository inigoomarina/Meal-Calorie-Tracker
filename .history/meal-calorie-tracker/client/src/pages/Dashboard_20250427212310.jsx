import { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';
import './Dashboard.css'; 

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
  const { user, updateUser, refreshUser, loading: authLoading } = useContext(AuthContext); // Get authLoading state
  const [isLoading, setIsLoading] = useState(true); // Local loading state for dashboard data
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
  const [isGoalSettingsOpen, setIsGoalSettingsOpen] = useState(false); // State for goal settings modal
  // Add a refresh counter to force data reload
  const [refreshCounter, setRefreshCounter] = useState(0);
  const location = useLocation(); 

  // Effect to update local goals when user context changes (runs independently)
  useEffect(() => {
    let isMounted = true;
    if (user && isMounted) {
      console.log("Dashboard: User context updated, updating local goals.");
      const userCalorieGoal = user.calorieGoal || 2000;
      setCalorieData(prev => ({
        ...prev, // Keep consumed value
        goal: userCalorieGoal,
        remaining: userCalorieGoal - prev.consumed 
      }));
      setMacroTargets({
        carbs: user.carbsGoal || 150,
        protein: user.proteinGoal || 100,
        fat: user.fatGoal || 70
      });
    }
     return () => { isMounted = false; };
  }, [user]); // Only depends on user object

  // Main data loading effect
  useEffect(() => {
    let isMounted = true; 

    const loadDashboardData = async () => {
      if (!isMounted || !user) { // Exit if unmounted or user data not yet available
          console.log("Dashboard: Load aborted (unmounted or no user data). User:", user);
          if (!user && !authLoading) { // If auth is done loading but user is null (e.g., invalid token)
             setError("User data not available. Please log in again.");
             setIsLoading(false); // Stop local loading
          } else if (!user && authLoading) {
             // Still waiting for auth context to load user
             setIsLoading(true); // Keep dashboard loading
          }
          return; 
      }
      
      console.log("Dashboard: Starting data load sequence...");
      setIsLoading(true); // Start dashboard specific loading
      setError(''); 
      
      try {
        // No need to call refreshUser() here if the context handles it, 
        // but we rely on the 'user' object being up-to-date from the context.
        // If goals MUST be absolutely fresh for this specific load, keep await refreshUser().
        // await refreshUser(); // Optional: Force refresh user data just before loading meals
        // if (!isMounted) return;

        const today = new Date().toISOString().split('T')[0];
        const cacheBuster = new Date().getTime();

        // Fetch today's meals
        console.log("Dashboard: Fetching today's meals...");
        const meals = await mealService.getUserMeals({ date: today, _t: cacheBuster });
        if (!isMounted) return; 
        console.log("Dashboard: Today's meals raw data:", meals);
        
        // Process meals
        const mealArray = Array.isArray(meals) ? meals : [];
        const processedMeals = mealArray.map(meal => {
            // ... (existing meal processing logic - ensure no async ops without isMounted checks) ...
            return {
                ...meal,
                calories: calories,
                nutrition: { protein, carbs, fat, fiber, sugar },
                formattedTime: formatMealDateTime(meal.time || meal.date)
            };
        }).filter(meal => meal !== null); 
        
        const sortedMeals = [...processedMeals].sort((a, b) => 
            new Date(b.time || b.date) - new Date(a.time || a.date)
        );
        
        if (!isMounted) return;
        setTodaysMeals(sortedMeals); 
        
        // Calculate today's consumed calories & update state
        const todayConsumedCalories = sortedMeals.reduce((total, meal) => total + (meal.calories || 0), 0);
        const currentCalorieGoal = user.calorieGoal || 2000; // Use user from closure
        if (isMounted) {
          setCalorieData({
            consumed: todayConsumedCalories,
            goal: currentCalorieGoal,
            remaining: Math.max(0, currentCalorieGoal - todayConsumedCalories) // Ensure remaining isn't negative
          });
        }

        // Load weekly stats
        console.log("Dashboard: Fetching weekly stats...");
        const weekStats = await mealService.getWeeklyStats();
        if (!isMounted) return;
        console.log("Dashboard: Weekly stats:", weekStats);
        
        // ... (process weekly stats, update today's data in weekStats) ...
        // Example: Ensure today's data in weekly stats matches calculated totals
        const todayIndex = weekStats?.days?.length ? weekStats.days.length - 1 : -1;
        if (weekStats && todayIndex !== -1) {
            // Safely update arrays if they exist
            if(weekStats.calories) weekStats.calories[todayIndex] = todayConsumedCalories;
            // ... update protein, carbs, fat similarly ...
        }

        if (isMounted) {
          setWeeklyData({ 
              labels: weekStats?.days || [], 
              calories: weekStats?.calories || [],
              proteins: weekStats?.proteins || [],
              carbs: weekStats?.carbs || [],
              fats: weekStats?.fats || []
          });
        }

        // Set macro targets (already handled by the separate [user] effect, but can be set here too for redundancy)
        // if (isMounted) { setMacroTargets({ ... }); }

      } catch (err) {
        if (isMounted) {
          console.error('Dashboard: Failed to load dashboard data:', err);
          setError(`Failed to load dashboard: ${err.message}. Please try refreshing.`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false); // Stop dashboard specific loading
          console.log("Dashboard: Data load sequence finished.");
        } else {
          console.log("Dashboard: Data load aborted, component unmounted during process.");
        }
      }
    };

    // Handle URL refresh parameter
    const urlSearchParams = new URLSearchParams(location.search);
    if (urlSearchParams.has('refresh')) {
      console.log("Dashboard: Refresh parameter detected.");
      window.history.replaceState({}, document.title, location.pathname); 
      // Trigger reload if not already triggered by counter change
      if (refreshCounter === 0) setRefreshCounter(1); // Or just let loadDashboardData run
    }

    loadDashboardData();

    // Cleanup function
    return () => {
      isMounted = false;
      console.log("Dashboard: Component unmounting or dependencies changed.");
    };

  // Dependencies: Trigger reload if refreshCounter changes, location.search changes, 
  // or the refreshUser function reference changes (should be stable now), or if authLoading finishes and user becomes available.
  }, [refreshCounter, location.search, refreshUser, user, authLoading]); // Added user and authLoading

  // Manual refresh function
  const refreshDashboard = useCallback(() => {
    console.log("Dashboard: Manual refresh triggered");
    setRefreshCounter(prev => prev + 1); 
  }, []); 

  // Save Goal Settings
  const handleGoalSettingsSave = useCallback(async (newGoals) => {
    try {
      console.log("Saving new goals:", newGoals);
      await updateUser(newGoals); // Assuming updateUser updates the user context
      setIsGoalSettingsOpen(false); // Close the modal on success
      refreshDashboard(); // Refresh data to reflect new goals
    } catch (error) {
      console.error("Failed to save goals:", error);
      setError("Failed to save goals. Please try again.");
    }
  }, [updateUser]); // Keep dependency

  // Calculate current macros from today's meals
  const calculateMacros = () => {
    return todaysMeals.reduce((totals, meal) => {
      const proteinValue = extractNutritionValue(meal, 'protein');
      const carbsValue = extractNutritionValue(meal, 'carbs');
      const fatValue = extractNutritionValue(meal, 'fat');
      console.log(`Meal ${meal.name} - Protein: ${proteinValue}, Carbs: ${carbsValue}, Fat: ${fatValue}`);
      return {
        protein: totals.protein + proteinValue,
        carbs: totals.carbs + carbsValue,
        fat: totals.fat + fatValue
      };
    }, { protein: 0, carbs: 0, fat: 0 });
  };

  const extractNutritionValue = (meal, nutrient) => {
    // Extracts the nutrient value from the meal object, returns 0 if not available
    return meal.nutrition?.[nutrient] || 0;
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

  // Conditional rendering: Show loading if auth is loading OR dashboard data is loading
  if (authLoading || (isLoading && todaysMeals.length === 0)) { 
     return <div className="loading">Loading dashboard...</div>;
  }
  
  // Show error if user is null after auth loading finishes
  if (!user && !authLoading) {
      return <div className="error-message">Could not load user data. Please <Link to="/">log in</Link>.</div>;
  }

  // Show dashboard content if user exists and data is loaded/loading
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'User'}!</h1>
        <div>
          <button onClick={refreshDashboard} className="btn btn-secondary" style={{marginRight: '10px'}}>
            Refresh Data
          </button>
          <Link to="/log-meal" className="btn btn-primary">Log a Meal</Link>
        </div>
      </div>

      {/* Display local error first */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={refreshDashboard} className="btn btn-small" disabled={isLoading}>Retry</button>
        </div>
      )}

      {/* Calories Summary Section with Circular Progress */}
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

      {/* Macros section with circular progress gauges */}
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

      {/* Today's Meals as a grid of cards */}
      <div className="card recent-meals">
        <h2>Today's Meals</h2>
        {todaysMeals.length > 0 ? (
          <div className="meals-grid">
            {todaysMeals.map(meal => (
              <div key={meal._id} className="meal-card" onClick={() => handleMealClick(meal)}>
                <h3 className="meal-name">{meal.name}</h3>
                <div className="meal-calories">{meal.calories} calories</div>
                <div className="meal-time">
                  {formatMealDateTime(meal.time)}
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
    </div>
  );
};

export default Dashboard;