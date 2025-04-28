import { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';
import MealCalendar from '../components/MealCalendar'; // Assuming MealCalendar might be used here or elsewhere

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
  const { user, updateUser, refreshUser } = useContext(AuthContext);
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
  
  // Add a refresh counter to force data reload
  const [refreshCounter, setRefreshCounter] = useState(0);
  const location = useLocation(); 

  // Effect to update local goals when user context changes
  useEffect(() => {
    if (user) {
      console.log("Dashboard: User context updated, setting goals locally.");
      const userCalorieGoal = user.calorieGoal || 2000;
      setCalorieData(prev => ({
        // Keep consumed value unless it's meant to be reset here
        ...prev, 
        goal: userCalorieGoal,
        // Recalculate remaining based on potentially updated goal and existing consumed
        remaining: userCalorieGoal - prev.consumed 
      }));
      setMacroTargets({
        carbs: user.carbsGoal || 150,
        protein: user.proteinGoal || 100,
        fat: user.fatGoal || 70
      });
    }
  }, [user]); // Only depends on user

  // Main data loading effect
  useEffect(() => {
    let isMounted = true; 

    const loadDashboardData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        console.log("Loading dashboard data...");
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        const cacheBuster = new Date().getTime();
        
        // Load today's meals first with cache busting
        console.log("Fetching today's meals...");
        const meals = await mealService.getUserMeals({ 
          date: today,
          _t: cacheBuster
        });
        
        console.log("Today's meals:", meals);
        
        // Sort meals by time (newest first)
        const mealArray = Array.isArray(meals) ? meals : [];
        const sortedMeals = [...mealArray].sort((a, b) => new Date(b.time) - new Date(a.time));
        
        setTodaysMeals(sortedMeals);
        
        // Load calorie summary for today
        console.log("Fetching calorie summary...");
        const summaryData = await mealService.getCalorieSummary(today);
        console.log("Calorie summary:", summaryData);
        
        setCalorieData(prev => ({
          ...prev,
          consumed: summaryData.totalCalories || 0,
          goal: user?.calorieGoal || 2000,
          remaining: (user?.calorieGoal || 2000) - (summaryData.totalCalories || 0)
        }));

        // Load weekly stats for charts
        console.log("Fetching weekly stats...");
        const weekStats = await mealService.getWeeklyStats();
        console.log("Weekly stats:", weekStats);
        
        setWeeklyData({
          labels: weekStats?.days || [],
          calories: weekStats?.calories || [],
          proteins: weekStats?.proteins || [],
          carbs: weekStats?.carbs || [],
          fats: weekStats?.fats || []
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Check for refresh flag from URL *before* loading data
    const urlSearchParams = new URLSearchParams(location.search);
    if (urlSearchParams.has('refresh')) {
      console.log("Dashboard: Refresh parameter detected.");
      window.history.replaceState({}, document.title, location.pathname); 
      // Trigger refresh via counter if not already triggered by location.search change
      // setRefreshCounter(prev => prev + 1); // This might cause double loading if location.search is also a dependency
    }

    loadDashboardData();

    return () => {
      isMounted = false;
      console.log("Dashboard: Cleanup function called (unmounting or deps changed).");
    };
  // Remove refreshUser from dependencies
  }, [user, refreshCounter, location.search]); 

  // Function to manually refresh dashboard data
  const refreshDashboard = () => {
    console.log("Manual dashboard refresh triggered");
    setRefreshCounter(prev => prev + 1);
  };

  // Calculate current macros from today's meals
  const currentMacros = {
    protein: todaysMeals.reduce((sum, meal) => {
      const proteinValue = meal.nutrition?.protein || 0;
      console.log(`Meal ${meal.name} protein: ${proteinValue}`);
      return sum + proteinValue;
    }, 0),
    carbs: todaysMeals.reduce((sum, meal) => {
      const carbsValue = meal.nutrition?.carbs || 0;
      console.log(`Meal ${meal.name} carbs: ${carbsValue}`);
      return sum + carbsValue;
    }, 0),
    fat: todaysMeals.reduce((sum, meal) => {
      const fatValue = meal.nutrition?.fat || 0;
      console.log(`Meal ${meal.name} fat: ${fatValue}`);
      return sum + fatValue;
    }, 0)
  };

  console.log("Current macros calculated:", currentMacros);

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
  // Use a more robust loading check, e.g., based on initial load vs subsequent refreshes
  const showLoading = isLoading && !todaysMeals.length; // Example: Show loading only if no meals are displayed yet

  if (showLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

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

      {error && (
        <div className="error-message">
          {error}
          <button onClick={refreshDashboard} className="btn btn-small">Retry</button>
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