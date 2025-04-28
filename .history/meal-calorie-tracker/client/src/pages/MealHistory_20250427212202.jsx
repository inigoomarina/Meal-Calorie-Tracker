import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import mealService from '../services/mealService';
import MealCalendar from '../components/MealCalendar'; 
import './MealHistory.css';

const MealHistory = () => {
  const { user } = useContext(AuthContext); // Get user context
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchMeals = async (filters = {}) => {
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

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

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
    
    fetchMeals(filters);
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

  // Determine the calorie goal to pass down
  const currentCalorieGoal = user?.calorieGoal || 2000;

  return (
    <div className="meal-history">
      <h1>Meal History</h1>

      {/* ... filters ... */}

      {isLoading && <div className="loading">Loading meal history...</div>}
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && (
        // Pass meals, delete handler, and calorie goal to MealCalendar
        <MealCalendar 
          meals={meals} 
          onDeleteMeal={handleDeleteMeal} 
          calorieGoal={currentCalorieGoal} // Pass the goal
        />
      )}
    </div>
  );
};

export default MealHistory;