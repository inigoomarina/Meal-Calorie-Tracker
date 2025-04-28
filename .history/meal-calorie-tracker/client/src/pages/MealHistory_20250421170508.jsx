import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import mealService from '../services/mealService';

const MealHistory = () => {
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    loadMeals();
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
      console.error('Failed to load meals:', err);
      setError('Failed to load meal history. Please try again.');
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSortChange = (e) => {
    const newSortOrder = e.target.value;
    setSortOrder(newSortOrder);
    
    // Re-sort the current meals without fetching again
    const newSortedMeals = sortMeals(meals, newSortOrder);
    setMeals(newSortedMeals);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    
    const filters = {};
    if (dateFilter.startDate) filters.startDate = dateFilter.startDate;
    if (dateFilter.endDate) filters.endDate = dateFilter.endDate;
    
    loadMeals(filters);
  };

  const handleDeleteMeal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    try {
      await mealService.deleteMeal(id);
      // Remove the deleted meal from the state
      setMeals(prevMeals => prevMeals.filter(meal => meal._id !== id));
    } catch (err) {
      console.error('Failed to delete meal:', err);
      setError('Failed to delete meal. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="meal-history-container">
      <h1>Meal History</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="controls-container">
        <form onSubmit={handleFilterSubmit} className="filter-form">
          <div className="date-range-container">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateFilter.startDate}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateFilter.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-filter">
            Apply Filters
          </button>
        </form>
        
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
      </div>

      {isLoading ? (
        <div className="loading">Loading meal history...</div>
      ) : meals.length > 0 ? (
        <div className="meals-table-container">
          <table className="meals-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Food</th>
                <th>Portion</th>
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
                  <td>{meal.portion}</td>
                  <td>{meal.calories}</td>
                  <td>{meal.nutrition?.protein || 0}g</td>
                  <td>{meal.nutrition?.carbs || 0}g</td>
                  <td>{meal.nutrition?.fat || 0}g</td>
                  <td className="actions-cell">
                    <Link to={`/meal/${meal._id}`} className="btn btn-small btn-view">
                      View
                    </Link>
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
      ) : (
        <div className="no-meals-message">
          <p>No meals found for the selected period.</p>
          <Link to="/log-meal" className="btn btn-primary">
            Log a Meal
          </Link>
        </div>
      )}
    </div>
  );
};

export default MealHistory;