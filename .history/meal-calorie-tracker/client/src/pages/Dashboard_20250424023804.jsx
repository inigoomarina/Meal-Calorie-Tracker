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
        
        // Wrap each API call in try-catch to identify specific failures
        let meals = [];
        try {
          console.log("Fetching today's meals...");
          meals = await mealService.getUserMeals({ 
            date: today,
            _t: cacheBuster
          });
          console.log("Today's meals raw data:", meals);
        } catch (mealError) {
          console.error("Failed to fetch meals:", mealError);
          throw new Error(`Meal data loading failed: ${mealError.message}`);
        }
        
        // Check if nutrition data exists in the response and how it's structured
        if (meals && meals.length > 0) {
          const sampleMeal = meals[0];
          console.log("Sample meal structure:", {
            id: sampleMeal._id,
            name: sampleMeal.name,
            calories: sampleMeal.calories,
            time: sampleMeal.time,
            // Check all possible nutrition data formats
            nutrition: JSON.stringify(sampleMeal.nutrition), // Use stringify to see full structure
            protein: sampleMeal.protein || sampleMeal.nutrition?.protein,
            carbs: sampleMeal.carbs || sampleMeal.nutrition?.carbs,
            fat: sampleMeal.fat || sampleMeal.nutrition?.fat
          });
        }
        
        // Process and normalize meal data with better error handling
        const mealArray = Array.isArray(meals) ? meals : [];
        const processedMeals = mealArray.map((meal, index) => {
          try {
            // More robust extraction of nutrition data
            const nutritionData = {
              protein: parseFloat(meal.protein || meal.nutrition?.protein || 0),
              carbs: parseFloat(meal.carbs || meal.nutrition?.carbs || 0),
              fat: parseFloat(meal.fat || meal.nutrition?.fat || 0),
              fiber: parseFloat(meal.fiber || meal.nutrition?.fiber || 0),
              sugar: parseFloat(meal.sugar || meal.nutrition?.sugar || 0)
            };
            
            // Create a properly formatted meal object with all required fields
            return {
              ...meal,
              time: meal.time || meal.createdAt || new Date().toISOString(),
              calories: parseInt(meal.calories) || 0,
              nutrition: nutritionData
            };
          } catch (mealProcessError) {
            console.error(`Error processing meal at index ${index}:`, mealProcessError);
            // Return a minimal valid meal object if processing fails
            return {
              ...meal,
              name: meal.name || `Meal ${index + 1}`,
              calories: parseInt(meal.calories) || 0,
              nutrition: {
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
                sugar: 0
              }
            };
          }
        });
        
        // Sort meals by time
        const sortedMeals = [...processedMeals].sort((a, b) => {
          try {
            const dateA = new Date(a.time);
            const dateB = new Date(b.time);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              return 0;
            }
            return dateB - dateA;
          } catch (err) {
            console.error("Error sorting meals by date:", err);
            return 0;
          }
        });
        
        setTodaysMeals(sortedMeals);
        
        // Load calorie summary for today with error handling
        let summaryData = { totalCalories: 0 };
        try {
          console.log("Fetching calorie summary...");
          summaryData = await mealService.getCalorieSummary(today);
          console.log("Calorie summary:", summaryData);
        } catch (summaryError) {
          console.error("Failed to fetch calorie summary:", summaryError);
          // Calculate summary from meals if API fails
          summaryData = {
            totalCalories: processedMeals.reduce((total, meal) => total + (meal.calories || 0), 0)
          };
          console.log("Calculated summary from meals:", summaryData);
        }
        
        setCalorieData({
          consumed: summaryData.totalCalories || 0,
          goal: user?.calorieGoal || 2000,
          remaining: (user?.calorieGoal || 2000) - (summaryData.totalCalories || 0)
        });

        // Load weekly stats for charts with error handling
        let weekStats = {
          days: [],
          calories: [],
          proteins: [],
          carbs: [],
          fats: []
        };
        
        try {
          console.log("Fetching weekly stats...");
          weekStats = await mealService.getWeeklyStats();
          console.log("Weekly stats:", weekStats);
        } catch (weeklyError) {
          console.error("Failed to fetch weekly stats:", weeklyError);
          // Generate default weekly data if API fails
          const today = new Date();
          weekStats = {
            days: Array.from({length: 7}, (_, i) => {
              const date = new Date(today);
              date.setDate(date.getDate() - i);
              return date.toLocaleDateString('en-US', {weekday: 'short'});
            }).reverse(),
            calories: Array(7).fill(0),
            proteins: Array(7).fill(0),
            carbs: Array(7).fill(0),
            fats: Array(7).fill(0)
          };
        }
        
        setWeeklyData({
          labels: weekStats.days || [],
          calories: weekStats.calories || [],
          proteins: weekStats.proteins || [],
          carbs: weekStats.carbs || [],
          fats: weekStats.fats || []
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(`Failed to load dashboard data: ${err.message}. Please try refreshing the page or check your connection.`);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user, refreshCounter]);

  // Enhanced refreshDashboard function with auto-retry
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

  // Enhanced macro calculation function with better debugging
  const calculateMacros = () => {
    console.log("Starting macro calculation with", todaysMeals.length, "meals");
    
    let protein = 0, carbs = 0, fat = 0;
    
    todaysMeals.forEach((meal, index) => {
      try {
        // Get nutrition data from all possible locations
        const mealProtein = extractNutritionValue(meal, 'protein');
        const mealCarbs = extractNutritionValue(meal, 'carbs');
        const mealFat = extractNutritionValue(meal, 'fat');
        
        console.log(`Meal ${index} (${meal.name}) nutrition:`, {
          raw: { 
            protein: meal.protein || meal.nutrition?.protein,
            carbs: meal.carbs || meal.nutrition?.carbs, 
            fat: meal.fat || meal.nutrition?.fat 
          },
          parsed: { protein: mealProtein, carbs: mealCarbs, fat: mealFat }
        });
        
        protein += mealProtein;
        carbs += mealCarbs;
        fat += mealFat;
      } catch (err) {
        console.error(`Error processing meal ${meal?.name || index}:`, err);
      }
    });
    
    const result = { protein, carbs, fat };
    console.log("Final calculated macros:", result);
    return result;
  };

  // Helper function to extract nutrition values safely
  const extractNutritionValue = (meal, nutrient) => {
    // Check all possible locations for the nutrition data
    const value = meal[nutrient] || // Direct property
                (meal.nutrition && meal.nutrition[nutrient]) || // In nutrition object
                0; // Default to 0
    
    // Convert to number and ensure it's valid
    const numValue = parseFloat(value);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Use the enhanced calculation
  const currentMacros = calculateMacros();
  console.log("Current macros calculated:", currentMacros);

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