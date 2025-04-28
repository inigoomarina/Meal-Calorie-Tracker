import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import mealService from '../services/mealService';

const MealHistory = () => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [meals, setMeals] = useState([]);
  const [dailyTotals, setDailyTotals] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate()
  });
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  // Get default date range (last 7 days)
  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    return new Date().toISOString().split('T')[0];
  }

  useEffect(() => {
    loadMealHistory();
  }, [dateRange, sortOrder]);

  const loadMealHistory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await mealService.getMealHistory({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        sort: sortOrder === 'newest' ? 'desc' : 'asc'
      });

      console.log("Meal history data:", response);
      setMeals(response);
      
      // Calculate daily totals
      const totals = calculateDailyTotals(response);
      setDailyTotals(totals);
    } catch (err) {
      console.error('Failed to load meal history:', err);
      setError('Failed to load meal history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDailyTotals = (mealsList) => {
    const totals = {};
    
    mealsList.forEach(meal => {
      const date = new Date(meal.time).toISOString().split('T')[0];
      
      if (!totals[date]) {
        totals[date] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          meals: []
        };
      }
      
      totals[date].calories += meal.calories || 0;
      totals[date].protein += parseFloat(meal.nutrition?.protein || 0);
      totals[date].carbs += parseFloat(meal.nutrition?.carbs || 0);
      totals[date].fat += parseFloat(meal.nutrition?.fat || 0);
      totals[date].meals.push(meal);
    });
    
    return totals;
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleDeleteMeal = async (mealId) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await mealService.deleteMeal(mealId);
        // Refresh the meal list
        loadMealHistory();
      } catch (err) {
        console.error('Failed to delete meal:', err);
        setError('Failed to delete meal. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const renderCalendarView = () => {
    // Get sorted dates for the calendar
    const dates = Object.keys(dailyTotals).sort();
    
    if (dates.length === 0) {
      return <div className="no-meals-message">No meals found for the selected period.</div>;
    }
    
    return (
      <div className="calendar-view">
        {dates.map(date => (
          <div key={date} className="calendar-day">
            <div className="calendar-date">
              <h3>{formatDate(date)}</h3>
            </div>
            <div className="calendar-totals">
              <div className="total-item"><span>Calories:</span> {Math.round(dailyTotals[date].calories)}</div>
              <div className="total-item"><span>Protein:</span> {dailyTotals[date].protein.toFixed(1)}g</div>
              <div className="total-item"><span>Carbs:</span> {dailyTotals[date].carbs.toFixed(1)}g</div>
              <div className="total-item"><span>Fat:</span> {dailyTotals[date].fat.toFixed(1)}g</div>
            </div>
            <div className="calendar-meals">
              <h4>Meals</h4>
              <ul>
                {dailyTotals[date].meals.map(meal => (
                  <li key={meal._id} className="calendar-meal">
                    <div className="meal-name">{meal.name}</div>
                    <div className="meal-calories">{meal.calories} cal</div>
                    <div className="meal-actions">
                      <button 
                        className="btn btn-small btn-delete" 
                        onClick={() => handleDeleteMeal(meal._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    if (meals.length === 0) {
      return <div className="no-meals-message">No meals found for the selected period.</div>;
    }
    
    return (
      <div className="meals-table-container">
        <table className="meals-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Food</th>
              <th>Calories</th>
              <th>Protein</th>
              <th>Carbs</th>
              <th>Fat</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {meals.map((meal) => (
              <tr key={meal._id}>
                <td>{formatDate(meal.time)}</td>
                <td>{meal.name}</td>
                <td>{meal.calories}</td>
                <td>{parseFloat(meal.nutrition?.protein || 0).toFixed(1)}g</td>
                <td>{parseFloat(meal.nutrition?.carbs || 0).toFixed(1)}g</td>
                <td>{parseFloat(meal.nutrition?.fat || 0).toFixed(1)}g</td>
                <td className="actions-cell">
                  <button 
                    className="btn btn-small btn-delete" 
                    onClick={() => handleDeleteMeal(meal._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="meal-history">
      <h1>Meal History</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="filters-container">
        <form className="date-filters">
          <div className="form-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
            />
          </div>
          
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={loadMealHistory}
          >
            Apply Filters
          </button>
        </form>
        
        <div className="view-controls">
          <div className="sort-container">
            <label htmlFor="sortOrder">Sort By:</label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={handleSortChange}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          
          <div className="view-toggle">
            <button 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleViewModeChange('list')}
            >
              List View
            </button>
            <button 
              className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleViewModeChange('calendar')}
            >
              Calendar View
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading meal history...</div>
      ) : (
        viewMode === 'calendar' ? renderCalendarView() : renderListView()
      )}
    </div>
  );
};

export default MealHistory;