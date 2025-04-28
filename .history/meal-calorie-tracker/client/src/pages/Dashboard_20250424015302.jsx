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
        
        console.log("Raw meals data from API:", meals);
        
        // Process and normalize meal data
        const mealArray = Array.isArray(meals) ? meals : [];
        const processedMeals = mealArray.map(meal => {
          // Inspect incoming nutrition data format
          console.log(`Processing meal: ${meal.name}, nutrition:`, meal.nutrition);
          
          // Create a properly formatted meal object with default values for missing data
          return {
            ...meal,
            // Ensure time exists with proper fallbacks
            time: meal.time || meal.createdAt || new Date().toISOString(),
            // Ensure calories is numeric
            calories: parseInt(meal.calories) || 0,
            // Create normalized nutrition object with numeric values
            nutrition: {
              // Handle different possible formats of nutrition data
              protein: typeof meal.nutrition === 'object' ? 
                parseFloat(meal.nutrition.protein || 0) : 
                (typeof meal.nutrition?.protein === 'number' ? meal.nutrition.protein : 0),
              carbs: typeof meal.nutrition === 'object' ? 
                parseFloat(meal.nutrition.carbs || 0) : 
                (typeof meal.nutrition?.carbs === 'number' ? meal.nutrition.carbs : 0),
              fat: typeof meal.nutrition === 'object' ? 
                parseFloat(meal.nutrition.fat || 0) : 
                (typeof meal.nutrition?.fat === 'number' ? meal.nutrition.fat : 0),
              fiber: typeof meal.nutrition === 'object' ? 
                parseFloat(meal.nutrition.fiber || 0) : 0,
              sugar: typeof meal.nutrition === 'object' ? 
                parseFloat(meal.nutrition.sugar || 0) : 0
            }
          };
        });
        
        // Log processed meal nutrition data
        processedMeals.forEach((meal, idx) => {
          console.log(`Processed meal ${idx+1} nutrition:`, meal.nutrition);
        });
        
        // Sort meals by time in descending order (newest first)
        const sortedMeals = [...processedMeals].sort((a, b) => {
          try {
            const dateA = new Date(a.time);
            const dateB = new Date(b.time);
            
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
              return 0; // Both invalid, consider equal
            } else if (isNaN(dateA.getTime())) {
              return 1; // A is invalid, B comes first
            } else if (isNaN(dateB.getTime())) {
              return -1; // B is invalid, A comes first
            }
            
            return dateB - dateA; // Both valid, compare normally
          } catch (err) {
            console.error("Error comparing dates:", err);
            return 0;
          }
        });
        
        // Debug sorted meals
        console.log(`Sorted ${sortedMeals.length} meals by date`);
        setTodaysMeals(sortedMeals);
        
        // Load calorie summary for today
        console.log("Fetching calorie summary...");
        const summaryData = await mealService.getCalorieSummary(today);
        console.log("Calorie summary:", summaryData);
        
        setCalorieData({
          consumed: summaryData.totalCalories || 0,
          goal: user?.calorieGoal || 2000,
          remaining: (user?.calorieGoal || 2000) - (summaryData.totalCalories || 0)
        });

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

    loadDashboardData();
  }, [user, refreshCounter]);

  // Function to manually refresh dashboard data
  const refreshDashboard = () => {
    console.log("Manual dashboard refresh triggered");
    setRefreshCounter(prev => prev + 1);
  };

  // Calculate the current macros from meals with safer parsing
  const calculateMacros = () => {
    try {
      let protein = 0, carbs = 0, fat = 0;
      
      console.log("Calculating macros from meals:", todaysMeals);
      
      if (!todaysMeals || todaysMeals.length === 0) {
        console.log("No meals found for macro calculation");
        return { protein: 0, carbs: 0, fat: 0 };
      }
      
      todaysMeals.forEach((meal, index) => {
        try {
          // Debug each meal's nutrition data
          console.log(`Meal ${index + 1} (${meal.name}) nutrition:`, meal.nutrition);
          
          // Fix operator precedence issue and ensure we're parsing numbers correctly
          const proteinValue = parseFloat(meal.nutrition?.protein || "0");
          const carbsValue = parseFloat(meal.nutrition?.carbs || "0");
          const fatValue = parseFloat(meal.nutrition?.fat || "0");
          
          // Log the actual values we're adding
          console.log(`Adding to macros - protein: ${proteinValue}, carbs: ${carbsValue}, fat: ${fatValue}`);
          
          // Add values with null/NaN checks
          protein += !isNaN(proteinValue) ? proteinValue : 0;
          carbs += !isNaN(carbsValue) ? carbsValue : 0;
          fat += !isNaN(fatValue) ? fatValue : 0;
        } catch (err) {
          console.error(`Error processing meal ${meal?._id || 'unknown'}:`, err);
        }
      });
      
      const result = { 
        protein: parseFloat(protein.toFixed(1)), 
        carbs: parseFloat(carbs.toFixed(1)), 
        fat: parseFloat(fat.toFixed(1)) 
      };
      
      console.log("Final calculated macros:", result);
      return result;
    } catch (err) {
      console.error("Error calculating macros:", err);
      return { protein: 0, carbs: 0, fat: 0 };
    }
  };

  // Use the safer macro calculation and make sure we call it when meals change
  useEffect(() => {
    // This ensures macro calculations are updated whenever todaysMeals changes
    const macros = calculateMacros();
    console.log("Updated macros:", macros);
  }, [todaysMeals]);

  const currentMacros = calculateMacros();

  // Improved formatMealDateTime function with better error handling
  const formatMealDateTime = (dateString) => {
    if (!dateString) {
      console.warn("Empty date string provided to formatMealDateTime");
      return "No date";
    }
    
    try {
      // Try to parse the date properly
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date in formatMealDateTime:", dateString);
        return "Invalid date";
      }
      
      // Format the date in a user-friendly way
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
        
        {/* Add debug information in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            <pre>
              Current Macros: {JSON.stringify(currentMacros, null, 2)}
            </pre>
          </div>
        )}
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
                  <span>P: {parseFloat(meal.nutrition?.protein || 0).toFixed(1)}g</span> • 
                  <span>C: {parseFloat(meal.nutrition?.carbs || 0).toFixed(1)}g</span> • 
                  <span>F: {parseFloat(meal.nutrition?.fat || 0).toFixed(1)}g</span>
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
            nutrition: {
              protein: parseFloat(selectedMeal.nutrition?.protein || 0).toFixed(1),
              carbs: parseFloat(selectedMeal.nutrition?.carbs || 0).toFixed(1),
              fat: parseFloat(selectedMeal.nutrition?.fat || 0).toFixed(1),
              fiber: parseFloat(selectedMeal.nutrition?.fiber || 0).toFixed(1),
              sugar: parseFloat(selectedMeal.nutrition?.sugar || 0).toFixed(1)
            }
          }} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default Dashboard;