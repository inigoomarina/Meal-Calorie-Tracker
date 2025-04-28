import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';

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
        <div className="circular-progress-value">{value}</div>alue)}</div>
        <div className="circular-progress-unit">{unit}</div>
      </div>
      {subtitle ? (
        <div className="circular-progress-subtitle">{subtitle}</div>
      ) : (
        <div className="circular-progress-remaining">{remaining}{unit} left</div>} left</div>
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
  
  // Add a refresh counter to force data reload
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
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
        const mealArray = Array.isArray(meals) ? meals : [];
        setTodaysMeals(mealArray);est first)
        const mealArray = Array.isArray(meals) ? meals : [];
        // Load calorie summary for today].sort((a, b) => new Date(b.time) - new Date(a.time));
        console.log("Fetching calorie summary...");
        const summaryData = await mealService.getCalorieSummary(today);
        console.log("Calorie summary:", summaryData);
        // Load calorie summary for today
        setCalorieData({ching calorie summary...");
          consumed: summaryData.totalCalories || 0,lorieSummary(today);
          goal: user?.calorieGoal || 2000,mmaryData);
          remaining: (user?.calorieGoal || 2000) - (summaryData.totalCalories || 0)
        });CalorieData({
          consumed: summaryData.totalCalories || 0,
        // Load weekly stats for charts00,
        console.log("Fetching weekly stats..."); - (summaryData.totalCalories || 0)
        const weekStats = await mealService.getWeeklyStats();
        console.log("Weekly stats:", weekStats);
        // Load weekly stats for charts
        setWeeklyData({tching weekly stats...");
          labels: weekStats?.days || [],ice.getWeeklyStats();
          calories: weekStats?.calories || [],);
          proteins: weekStats?.proteins || [],
          carbs: weekStats?.carbs || [],
          fats: weekStats?.fats || [][],
        });alories: weekStats?.calories || [],
      } catch (err) {eekStats?.proteins || [],
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      } console.error('Failed to load dashboard data:', err);
    };  setError('Failed to load dashboard data. Please try again.');
      } finally {
    loadDashboardData();se);
  }, [user, refreshCounter]); // Add refreshCounter to dependencies
    };
  // Function to manually refresh dashboard data
  const refreshDashboard = () => {
    console.log("Manual dashboard refresh triggered"); dependencies
    setRefreshCounter(prev => prev + 1);
  }; Function to manually refresh dashboard data
  const refreshDashboard = () => {
  // Calculate current macros from today's mealsred");
  const currentMacros = {v => prev + 1);
    protein: todaysMeals.reduce((sum, meal) => sum + (meal.nutrition?.protein || 0), 0),
    carbs: todaysMeals.reduce((sum, meal) => sum + (meal.nutrition?.carbs || 0), 0),
    fat: todaysMeals.reduce((sum, meal) => sum + (meal.nutrition?.fat || 0), 0)
  };nst currentMacros = {
    protein: todaysMeals.reduce((sum, meal) => {
  console.log("Current macros calculated:", currentMacros);
      console.log(`Meal ${meal.name} protein: ${proteinValue}`);
  // Handle opening meal detail modal
  const handleMealClick = (meal) => {
    setSelectedMeal(meal);uce((sum, meal) => {
  };  const carbsValue = meal.nutrition?.carbs || 0;
      console.log(`Meal ${meal.name} carbs: ${carbsValue}`);
  // Handle closing meal detail modal
  const handleCloseModal = () => {
    setSelectedMeal(null);e((sum, meal) => {
  };  const fatValue = meal.nutrition?.fat || 0;
      console.log(`Meal ${meal.name} fat: ${fatValue}`);
  if (isLoading) { fatValue;
    return <div className="loading">Loading dashboard...</div>;
  };

  return (log("Current macros calculated:", currentMacros);
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'User'}!</h1>
        <div>
          <button onClick={refreshDashboard} className="btn btn-secondary" style={{marginRight: '10px'}}>
            Refresh DataTime())) {
          </button>or("Invalid date:", dateString);
          <Link to="/log-meal" className="btn btn-primary">Log a Meal</Link>
        </div>
      </div>
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      {error && (r) {
        <div className="error-message">ate:", error, dateString);
          {error}or";
          <button onClick={refreshDashboard} className="btn btn-small">Retry</button>
        </div>
      )}
  // Format date for display with date and time
      {/* Calories Summary Section with Circular Progress */}
      <div className="card macros-section">
        <h2>Calories</h2>te(dateString);
        <div className="calories-display">
          <CircularProgress ";
            value={calorieData.consumed} 
            max={calorieData.goal} 
            color="#FF9800" ring([], { 
            title="Today's Calories" 
            unit="cal",
            size="large"
            subtitle={`Goal: ${calorieData.goal} cal`}
          />
        </div>rror) {
      </div>e.error("Error formatting date:", error);
      return "Error";
      {/* Weekly Calories Section */}
      <div className="card weekly-section">
        <h2>Weekly Overview</h2>
        <WeeklyCaloriesDisplay data={weeklyData} />
      </div>leMealClick = (meal) => {
    setSelectedMeal(meal);
      {/* Macros section with circular progress gauges */}
      <div className="card macros-section">
        <h2>Macros</h2>l detail modal
        <div className="macros-gauges">
          <CircularProgress 
            value={currentMacros.carbs} 
            max={macroTargets.carbs} 
            color="#4CAF50" 
            title="Net Carbs" ding">Loading dashboard...</div>;
            unit="g"
          />
          <CircularProgress 
            value={currentMacros.fat} 
            max={macroTargets.fat} der">
            color="#9C27B0" name || 'User'}!</h1>
            title="Fat" 
            unit="g"Click={refreshDashboard} className="btn btn-secondary" style={{marginRight: '10px'}}>
          />Refresh Data
          <CircularProgress 
            value={currentMacros.protein} btn btn-primary">Log a Meal</Link>
            max={macroTargets.protein} 
            color="#2196F3" 
            title="Protein" 
            unit="g"
          /> className="error-message">
        </div>or}
      </div>utton onClick={refreshDashboard} className="btn btn-small">Retry</button>
        </div>
      {/* Today's Meals as a grid of cards */}
      <div className="card recent-meals">
        <h2>Today's Meals</h2>tion with Circular Progress */}
        {todaysMeals.length > 0 ? (ection">
          <div className="meals-grid">
            {todaysMeals.map(meal => (ay">
              <div key={meal._id} className="meal-card" onClick={() => handleMealClick(meal)}>
                <h3 className="meal-name">{meal.name}</h3>
                <div className="meal-calories">{meal.calories} calories</div>
                <div className="meal-time">
                  {new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>rge"
            ))}title={`Goal: ${calorieData.goal} cal`}
          </div>
        ) : (>
          <p className="no-meals">No meals logged today. <Link to="/log-meal">Add a meal</Link>.</p>
        )}
      </div>ekly Calories Section */}
      <div className="card weekly-section">
      {/* Meal Detail Modal */}>
      {selectedMeal && <MealDetailModal meal={selectedMeal} onClose={handleCloseModal} />}
    </div>v>
  );
};    {/* Macros section with circular progress gauges */}
      <div className="card macros-section">
export default Dashboard;
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