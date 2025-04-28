import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';

// Register required ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const CircularProgress = ({ value, max, color, title, unit }) => {
  // Calculate percentage for the circle fill
  const percentage = Math.min(100, (value / max) * 100);
  const rotation = percentage / 100 * 360;
  const remaining = Math.max(0, max - value);

  return (
    <div className="circular-progress">
      <div className="circular-progress-title">{title}</div>
      <div className="circular-progress-container" style={{ '--rotation': `${rotation}deg`, '--color': color }}>
        <div className="circular-progress-value">{value}</div>
        <div className="circular-progress-unit">{unit}</div>
      </div>
      <div className="circular-progress-remaining">{remaining}g left</div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [calorieData, setCalorieData] = useState({
    consumed: 0,
    goal: 2000, // Default goal, should ideally come from user settings
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
  // Define macro targets (these could also come from user settings)
  const [macroTargets, setMacroTargets] = useState({
    carbs: 150,
    protein: 100,
    fat: 70
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Load calorie summary for today
        const summaryData = await mealService.getCalorieSummary(today);
        setCalorieData({
          consumed: summaryData.totalCalories || 0,
          goal: user?.calorieGoal || 2000,
          remaining: (user?.calorieGoal || 2000) - (summaryData.totalCalories || 0)
        });

        // Load weekly stats for charts
        const weekStats = await mealService.getWeeklyStats();
        setWeeklyData({
          labels: weekStats.days,
          calories: weekStats.calories,
          proteins: weekStats.proteins,
          carbs: weekStats.carbs,
          fats: weekStats.fats
        });

        // Load today's meals
        const meals = await mealService.getUserMeals({ date: today });
        setTodaysMeals(meals);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Chart data for weekly calories
  const weeklyCaloriesData = {
    labels: weeklyData.labels,
    datasets: [
      {
        label: 'Calories',
        data: weeklyData.calories,
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  // Calculate current macros
  const currentMacros = {
    protein: todaysMeals.reduce((sum, meal) => sum + (meal.nutrition?.protein || 0), 0),
    carbs: todaysMeals.reduce((sum, meal) => sum + (meal.nutrition?.carbs || 0), 0),
    fat: todaysMeals.reduce((sum, meal) => sum + (meal.nutrition?.fat || 0), 0)
  };

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'User'}!</h1>
        <Link to="/log-meal" className="btn btn-primary">Log a Meal</Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-cards">
        <div className="card calorie-summary">
          <h2>Today's Calories</h2>
          <div className="calorie-stats">
            <div className="stat">
              <span className="label">Consumed</span>
              <span className="value">{calorieData.consumed}</span>
            </div>
            <div className="stat">
              <span className="label">Goal</span>
              <span className="value">{calorieData.goal}</span>
            </div>
            <div className="stat">
              <span className="label">Remaining</span>
              <span className="value">{calorieData.remaining}</span>
            </div>
          </div>
          
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${Math.min(100, (calorieData.consumed / calorieData.goal) * 100)}%`,
                backgroundColor: calorieData.consumed > calorieData.goal ? '#ff4d4d' : '#4caf50'
              }}
            />
          </div>
          <div className="progress-labels">
            <span>0</span>
            <span>{calorieData.goal}</span>
          </div>
        </div>

        <div className="card weekly-chart">
          <h2>Weekly Calories</h2>
          <Bar data={weeklyCaloriesData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* New Macros section with circular progress gauges */}
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

      <div className="card recent-meals">
        <h2>Today's Meals</h2>
        {todaysMeals.length > 0 ? (
          <ul className="meal-list">
            {todaysMeals.map(meal => (
              <li key={meal._id} className="meal-item">
                <div className="meal-info">
                  <h3>{meal.name}</h3>
                  <p>{meal.calories} calories</p>
                  <p className="meal-time">{new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="meal-actions">
                  <Link to={`/meal/${meal._id}`} className="btn btn-small">View</Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-meals">No meals logged today. <Link to="/log-meal">Add a meal</Link>.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;