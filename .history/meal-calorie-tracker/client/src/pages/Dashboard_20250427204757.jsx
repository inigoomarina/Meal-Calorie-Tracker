import { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation
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
  const { user, updateUser, refreshUser } = useContext(AuthContext); // Get updateUser and refreshUser
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [calorieData, setCalorieData] = useState({
    consumed: 0,
    goal: 2000, // Initial default
    remaining: 2000
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
    carbs: 150, // Initial default
    protein: 100, // Initial default
    fat: 70 // Initial default
  });
  
  // State for selected meal modal
  const [selectedMeal, setSelectedMeal] = useState(null);
  
  // State for goal settings modal
  const [isGoalSettingsOpen, setIsGoalSettingsOpen] = useState(false);
  
  // Add a refresh counter to force data reload
  const [refreshCounter, setRefreshCounter] = useState(0);
  const location = useLocation(); // Get location object

  useEffect(() => {
    // Update goals from user context when user loads or changes
    if (user) {
      const userCalorieGoal = user.calorieGoal || 2000;
      setCalorieData(prev => ({
        ...prev,
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
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        console.log("Loading dashboard data...");
        const today = new Date().toISOString().split('T')[0];
        const cacheBuster = new Date().getTime();
        
        // Fetch user data first to ensure goals are up-to-date
        await refreshUser(); 
        
        // Fetch today's meals
        let meals = [];
        try {
          console.log("Fetching today's meals...");
          meals = await mealService.getUserMeals({ 
            date: today, // Ensure only today's meals are fetched
            _t: cacheBuster
          });
          console.log("Today's meals raw data:", meals);
        } catch (mealError) {
          console.error("Failed to fetch meals:", mealError);
          throw new Error(`Meal data loading failed: ${mealError.message}`);
        }
        
        // Process meals - Ensure only meals with today's date are included
        const mealArray = Array.isArray(meals) ? meals : [];
        const processedMeals = mealArray.map((meal, index) => {
          try {
            const mealDate = new Date(meal.date || meal.time || meal.createdAt);
            if (isNaN(mealDate.getTime())) {
              console.warn(`Invalid date for meal ${index}:`, meal);
              return null; // Skip meals with invalid dates
            }
            const mealDateStr = mealDate.toISOString().split('T')[0];
            
            // Strict check for today's date
            if (mealDateStr !== today) {
              console.log(`Skipping meal from ${mealDateStr}, not today:`, meal.name);
              return null;
            }
            
            // More robust extraction of nutrition data
            const nutritionData = {
              protein: parseFloat(meal.protein || meal.nutrition?.protein || 0),
              carbs: parseFloat(meal.carbs || meal.nutrition?.carbs || 0),
              fat: parseFloat(meal.fat || meal.nutrition?.fat || 0),
              fiber: parseFloat(meal.fiber || meal.nutrition?.fiber || 0),
              sugar: parseFloat(meal.sugar || meal.nutrition?.sugar || 0)
            };
            
            console.log(`Processing meal ${index} (${meal.name}): Nutrition data:`, nutritionData);
            
            // Create a properly formatted meal object with all required fields
            return {
              ...meal,
              time: meal.time || meal.createdAt || new Date().toISOString(),
              calories: parseInt(meal.calories) || 0,
              // Store nutrition data in both formats for compatibility
              nutrition: nutritionData,
              protein: nutritionData.protein,
              carbs: nutritionData.carbs,
              fat: nutritionData.fat,
              fiber: nutritionData.fiber,
              sugar: nutritionData.sugar
            };
          } catch (mealProcessError) {
            console.error(`Error processing meal at index ${index}:`, mealProcessError);
            // Return null for invalid meals
            return null;
          }
        }).filter(meal => meal !== null); // Remove any null entries
        
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
        
        setTodaysMeals(sortedMeals); // Set state with ONLY today's meals
        
        // Calculate today's consumed calories directly from the filtered meals
        const todayConsumedCalories = sortedMeals.reduce((total, meal) => total + (meal.calories || 0), 0);
        
        // Update calorieData state using the latest user goal
        const currentCalorieGoal = user?.calorieGoal || 2000;
        setCalorieData({
          consumed: todayConsumedCalories,
          goal: currentCalorieGoal,
          remaining: currentCalorieGoal - todayConsumedCalories
        });

        // Load weekly stats (this remains largely the same)
        try {
          console.log("Fetching weekly stats...");
          const weekStats = await mealService.getWeeklyStats();
          console.log("Weekly stats:", weekStats);
          
          if (weekStats && weekStats.days) {
            // Ensure today's data in weekly stats reflects the calculated totals
            const todayIndex = weekStats.days.length - 1; // Assuming today is the last day
            if (todayIndex >= 0) {
              weekStats.calories[todayIndex] = todayConsumedCalories;
              weekStats.proteins[todayIndex] = sortedMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
              weekStats.carbs[todayIndex] = sortedMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
              weekStats.fats[todayIndex] = sortedMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
            }
            
            setWeeklyData({
              labels: weekStats.days || [],
              calories: weekStats.calories || [],
              proteins: weekStats.proteins || [],
              carbs: weekStats.carbs || [],
              fats: weekStats.fats || []
            });
          } else {
            throw new Error("Invalid weekly stats data returned");
          }
        } catch (weeklyError) {
          console.error("Failed to fetch weekly stats:", weeklyError);
          // Generate default weekly data if API fails
          const today = new Date();
          const defaultWeekStats = {
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
          
          // Put today's data in the last position if we have it
          if (processedMeals.length > 0) {
            const todayIndex = 6; // Last position in a 7-day array
            defaultWeekStats.calories[todayIndex] = todayConsumedCalories; // Use calculated today's calories
            defaultWeekStats.proteins[todayIndex] = sortedMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
            defaultWeekStats.carbs[todayIndex] = sortedMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
            defaultWeekStats.fats[todayIndex] = sortedMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
          }
          
          setWeeklyData(defaultWeekStats);
        }

        // Set macro targets based on the latest user data
        setMacroTargets({
          carbs: user?.carbsGoal || 150,
          protein: user?.proteinGoal || 100,
          fat: user?.fatGoal || 70
        });

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(`Failed to load dashboard data: ${err.message}. Please try refreshing the page or check your connection.`);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
    
    // Check for refresh flag from URL (e.g., after logging a meal)
    const urlSearchParams = new URLSearchParams(location.search);
    if (urlSearchParams.has('refresh')) {
      console.log("Dashboard refresh parameter detected, triggering refresh.");
      // Clear the URL parameter without refreshing page
      window.history.replaceState({}, document.title, location.pathname);
      // Trigger data reload via refreshCounter
      setRefreshCounter(prev => prev + 1); 
    }

  }, [user, refreshCounter, location.search, refreshUser]); // Add location.search and refreshUser

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
      // Optionally trigger a refresh if needed, though context update should handle it
      // refreshDashboard(); 
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
          {error}
          <button onClick={refreshDashboard} className="btn btn-small">Retry</button>
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
        // Pass current goals from user context or state as initial values
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