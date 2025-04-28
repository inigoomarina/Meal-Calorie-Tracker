import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mealService from '../services/mealService';
import MealCalendar from '../components/MealCalendar';
import './MealHistory.css';

const MealHistory = () => {
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState('calendar');
  const navigate = useNavigate();

  useEffect(() => {
    // Set default date range to last 7 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
    
    loadMeals({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  }, []);

  const loadMeals = async (filters = {}) => {
    setIsLoading(true);
    setError('');

    try {
      const mealsData = await mealService.getUserMeals(filters);
      
      // Sort meals based on current sort order
      const sortedMeals = sortMeals(mealsData, sortOrder);
      setMeals(sortedMeals);
    } catch (err) {
      console.error('Failed to load meal history:', err);
      setError('Failed to load meal history. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const sortMeals = (mealsToSort, order) => {
    return [...mealsToSort].sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return order === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilter = (e) => {
    e.preventDefault();
    loadMeals(dateRange);
  };

  const handleSortChange = (e) => {
    const newSortOrder = e.target.value;
    setSortOrder(newSortOrder);
    setMeals(sortMeals(meals, newSortOrder));
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Are you sure you want to delete this meal?')) return;
    
    try {
      await mealService.deleteMeal(mealId);
      setMeals(meals.filter(meal => meal._id !== mealId));
    } catch (err) {
      console.error('Failed to delete meal:', err);
      setError('Failed to delete meal. Please try again later.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
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
        <form className="date-filters" onSubmit={handleFilter}>
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
          
          <button type="submit" className="btn btn-primary">
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
        viewMode === 'calendar' ? 
          <MealCalendar 
            meals={meals} 
            onDeleteMeal={handleDeleteMeal}
          /> : 
          renderListView()
      )}
    </div>
  );
};

export default MealHistory;